## Context

См. `proposal.md` — Why. Текущее состояние:

- `AddFriendButton.tsx` — чисто локальный (`useState(sent)`), API не вызывает; используется в `ProfileView.tsx` (обе ветки — обычная и `profileHidden`).
- `ProfileRead` (`src/modules/profiles/types.ts`) не содержит отношения; `buildProfile` (`src/modules/profiles/service.ts`) получает зрителя (`viewerId`) и уже грузит данные пользователя.
- `friendships` модуль: `findFriendshipBetween` (`repository.ts:135`) возвращает `Friendship | null`; `listFriends` (`repository.ts:88`) возвращает `SocialUser[]` без id дружбы; `deletePendingRequest` удаляет только `pending`.
- `DELETE /api/friendships/[id]` (`src/app/api/friendships/[id]/route.ts`) — отмена заявки. Рядом — статические маршруты `accept`, `decline`, `search` (`POST`), `friendships` (`POST` создание).
- `RelationshipStatus = 'friend' | 'pending_in' | 'pending_out' | 'none'` уже существует (`friendships/types.ts`) и вычисляется в SQL поиска.
- Поиск (`FriendsView.resultAction`) уже показывает `Badge` для друга и pending и кнопку только для `none`.
- Модуль `profiles` уже импортирует другой модуль (`@/modules/ratings`) — межмодульные импорты допустимы; ограничения в `platform/architecture-boundaries` и `.dependency-cruiser.cjs`.
- Тост-механизм добавляется изменением `toast-notifications` (зависимость для фидбека).

## Goals / Non-Goals

**Goals:**

- Действие в профиле и в поиске/списке друзей следует отношению; повторы добавления невозможны.
- Серверная операция расфренда с проверкой прав и подтверждением в UI.
- Реальная отправка/удаление через API с фидбеком.

**Non-Goals:**

- Блокировка пользователей, отписка от активности друга, история расфрендов.
- Уведомления (тост — ответственность `toast-notifications`).
- Изменение модели `friendships` (статусы и уникальный индекс остаются).

## Decisions

### 1. Отношение в данных профиля

Экспортировать из `friendships` новую функцию `getRelationship(viewerId, otherUserId): { status: RelationshipStatus, friendshipId: number | null }` на основе `findFriendshipBetween`. В `buildProfile` (при `viewerId !== null && !isOwn`) добавить `relationship` в `ProfileRead`. Направление pending определяем по `requesterId`: `pending_out` если заявку отправил зритель, иначе `pending_in`.

- Почему: `findFriendshipBetween` уже даёт строку дружбы; направление выводится из `requesterId`.
- Альтернатива: тянуть отношение отдельным запросом на клиенте — лишний round-trip и рассинхрон; отклонено.

### 2. id дружбы в списке друзей

`listFriends` дополнительно выбирает `f.id AS friendship_id`; вводим тип `FriendEntry = { friendshipId: number; user: SocialUser }` и меняем `getFriends` на `FriendEntry[]`. Адаптер `toPublicUser` вызывается с `entry.user`.

- Почему: для расфренда из списка нужен id дружбы, а `SocialUser` намеренно не носит служебных полей.
- Альтернатива: расширить `SocialUser` опциональным `friendshipId` — размывает тип, используемый в заявках и поиске; отклонено.

### 3. Серверная операция расфренда

Новый сервис `removeFriend(actor, { friendshipId })` в `friendships/service.ts`. Repository: `deleteAcceptedFriendship(id, actorId)` — `DELETE ... WHERE id = $1 AND status = accepted AND (requester_id = $2 OR addressee_id = $2) RETURNING ...`. Сервис: `NOT_FOUND` если строки нет, `CONFLICT` если удалять нечего (не accepted). Событие активности не пишем (жанров `activity_events.kind` фиксирован, расширение не входит в объём).

Ручка: `POST /api/friendships/remove` (схема `{ friendshipId }`) через `withRoute` с `rateLimit`, как у `accept`/`decline`. Паттерн статических маршрутов уже принят (`accept`, `decline`, `search`).

### 4. Единый компонент действия

Заменить `AddFriendButton` на `FriendActionButton({ userId, relationship, friendshipId })`, который рендерит:
- `friend` → кнопка «Убрать из друзей» (открывает подтверждение);
- `pending_out` → элемент «Заявка отправлена» (без действия добавления);
- `pending_in` → пометка «Ожидает ответа»;
- `none` → кнопка «Добавить в друзья».

Компонент используется в `ProfileView` и в `FriendsView` (список «Друзья» и результат поиска — там `resultAction` переиспользует те же ярлыки). Отправка/удаление — через `social-actions` (возвращают `Promise`) с тостами из `toast-notifications`; при ошибке — error-тост и откат оптимистичного состояния.

### 5. Подтверждение расфренда

Перед удалением — «Modal» с вопросом и кнопками «Убрать»/«Отмена» (тот же паттерн, что у удаления записи и роспуска группы). Отмена ничего не делает; подтверждение вызывает `removeFriend` и по успеху убирает друга из локального списка/меняет действие профиля.

## Risks / Trade-offs

- [Межмодульная зависимость profiles → friendships] → направление совпадает с существующим profiles → ratings; цикла нет (friendships profiles не импортирует); проверить `npm run deps:check`.
- [Смена формы `getFriends`] → затрагивает адаптеры и экран friends; обновить вместе.
- [`AddFriendButton` — mock] → удаление/замена ломает текущие тесты/e2e, ссылающиеся на него; обновить.
- [Оптимистичное удаление без отката] → откатывать локальный стейт при ошибке, иначе список разойдётся с сервером.
- [Отношение в `profileHidden`-ветке] → действие должно учитывать отношение и там; передавать `relationship` в обе ветки `ProfileView`.

## Migration Plan

- Сервер: без миграций БД (схема `friendships` не меняется). Добавить сервис, repository-функцию и ручку `POST /api/friendships/remove`.
- Клиент: заменить `AddFriendButton` на `FriendActionButton`, прокинуть `relationship`/`friendshipId` в `ProfileView`, `FriendsView`, адаптеры.
- Откат: убрать ручку и компонент, вернуть прежний `AddFriendButton`; данные дружб не затрагиваются (операция удаляет существующие строки, откат кода её не возвращает — учесть при откате в проде).
