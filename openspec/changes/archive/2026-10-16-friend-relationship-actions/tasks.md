## 1. Серверная часть

- [x] 1.1 В `src/modules/friendships/repository.ts` добавить выбор `f.id AS friendship_id` в `listFriends` и функцию `deleteAcceptedFriendship(id, actorId)` (удаление при `status = accepted` и участии актора); integration-тест `tests/integration/friendships.test.ts` — друг удаляется, чужая дружба не удаляется.
- [x] 1.2 В `src/modules/friendships/types.ts` добавить `FriendEntry = { friendshipId; user: SocialUser }`; в `service.ts` перевести `getFriends` на `FriendEntry[]` и добавить `removeFriend(actor, input): Result<Friendship>` (`NOT_FOUND` при отсутствии, `CONFLICT` если не accepted); схему `removeFriendInput` и экспорты в `index.ts`; `npm run typecheck` зелёный, unit-тест сервиса.
- [x] 1.3 Добавить ручку `POST /api/friendships/remove` (`src/app/api/friendships/remove/route.ts`) через `withRoute` со схемой, `resolveActor`, `rateLimit`; unit-тест маршрута и integration на успех, отказ по правам и конфликт.
- [x] 1.4 Экспортировать `getRelationship(viewerId, otherUserId): { status: RelationshipStatus; friendshipId: number | null }` из `friendships` и добавить поле `relationship` в `ProfileRead`, заполняя его в `buildProfile` (`src/modules/profiles/service.ts`) для чужого профиля с учётом направления pending; unit-тест `tests/unit/profiles.test.ts`.

## 2. Интерфейс

- [x] 2.1 Создать `FriendActionButton({ userId, relationship, friendshipId })` в `src/components/features/movie-tracker/` (друг → «Убрать из друзей» с подтверждением через `Modal`; `pending_out` → «Заявка отправлена»; `pending_in` → «Ожидает ответа»; `none` → «Добавить в друзья»); unit-тест на все четыре состояния и на подтверждение/отмену.
- [x] 2.2 Прокинуть отношение в `ProfileView.tsx` (обе ветки, включая `profileHidden`) и в адаптеры профиля; unit-тест: у друга нет кнопки добавления, у не-друга есть.
- [x] 2.3 В `FriendsView.tsx` использовать `FriendActionButton` для списка «Друзья» и результата поиска; в `social-actions.ts` добавить `removeFriend(friendshipId)`, возвращающий `Promise`, и показывать тост с откатом локального состояния при ошибке; unit-тест `tests/unit/social-actions`.
- [x] 2.4 Удалить `AddFriendButton.tsx` и обновить ссылающиеся на него места и тесты; `npm run typecheck` и `npm run test` зелёные.

## 3. Финальная проверка

- [x] 3.1 `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm run test`, `npm run test:integration` проходят; e2e-сценарий: «Убрать из друзей» с подтверждением убирает друга из списка и из поиска, после чего доступно «Добавить в друзья»; существующие e2e не регрессируют.
