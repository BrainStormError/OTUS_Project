## Context

См. `proposal.md` — Why. Текущее состояние:

- Моменты времени приходят с сервера как ISO-строки UTC: `mapPost`/`mapDiscussion` (`src/modules/discussions/repository.ts`) и события активности (`src/modules/activity`) вызывают `.toISOString()`. В БД это `timestamptz` (`..._discussions.sql`, `..._discussion_posts.sql`, `..._activity_events.sql`).
- Отображение усекает строку: `post.createdAt.slice(0, 10)` в `GroupDiscussions.tsx:123`, `event.createdAt.slice(0, 10)` в `GroupActivity.tsx:71`, `watchedAt = item.createdAt.slice(0, 10)` в `feed.ts:32`. Даты просмотра (`ratings.watched_at`, тип `date`) приходят уже готовыми и показываются как `YYYY-MM-DD`.
- Пользовательские предпочтения реализованы в `src/components/layout/preferences.ts`: ключи `theme`, `identity-display`, `rail-collapsed` в `localStorage`, событие `PREFERENCES_EVENT` и хуки (`useIdentityDisplay`, `useRailCollapsed`) с синхронизацией по `storage`/`PREFERENCES_EVENT`. Серверных предпочтений, кроме приватности, нет.
- Страницы помечены `force-dynamic`; сервер не знает тайм-зону браузера. Тема решает рассинхрон inline-скриптом и `suppressHydrationWarning` (`src/app/layout.tsx`).
- `SettingsView.tsx` — секции «Тема», «Отображение имени», «Имя и тэг», «Приватность».

## Goals / Non-Goals

**Goals:**

- Тайм-зона и формат часов как локальные предпочтения, единый формат `HH:mm DD.MM.YY`.
- Единый форматтер, применяемый ко всем моментам времени.
- Управление в настройках с немедленным эффектом.

**Non-Goals:**

- Серверное хранение тайм-зоны и синхронизация между устройствами.
- Изменение серверного представления времени (остаётся ISO UTC) и типа `date` для дат просмотра.
- Автоопределение «правильной» тайм-зоны и ручные смещения (берём IANA-идентификаторы).

## Decisions

### 1. Хранение предпочтений — `localStorage`, как тема

Добавляем в `src/components/layout/preferences.ts` ключи `timezone` и `hour-cycle`, значения по умолчанию — пусто (означает «браузерная тайм-зона») и `24`. Экспортируем `useTimeFormat()` (возвращает `{ timeZone, hour12, setTimeZone, setHourCycle }`) с той же синхронизацией через `storage`/`PREFERENCES_EVENT`, что и у существующих хуков.

- Почему: пользователь выбрал локальное хранение; это консистентно с темой и не требует миграций/API.
- Альтернатива: колонка `users.timezone` + `/api/me/...` — синхронизация между устройствами ценой миграции и API; отклонено по решению пользователя.

### 2. Действительное значение тайм-зоны

«По умолчанию» трактуем как явный IANA-идентификатор: эффективная зона = сохранённая, если задана и валидна, иначе `Intl.DateTimeFormat().resolvedOptions().timeZone`. Проверка валидности — попыткой `new Intl.DateTimeFormat(undefined, { timeZone })` в `try/catch`; невалидное значение откатывается к браузерной зоне (сценарий `Unavailable timezone falls back`).

### 3. Форматтер без зависимости от локали

Утилита `formatTimestamp(iso, { timeZone, hour12 })` использует `Intl.DateTimeFormat('ru-RU', { timeZone, hour12, hour, minute, day, month, year })` и `formatToParts`, собирая строку вручную: `HH:mm DD.MM.YY` для 24 ч и `h:mm AM/PM DD.MM.YY` (день-период из `formatToParts`) для 12 ч. Ручная сборка гарантирует порядок и разделители независимо от локали и покрывает требование `Consistent timestamp format`.

- Почему: `toLocaleString` даёт локальный порядок (`11.10.2026, 14:07`) и не подходит под требуемый вид.
- 12 ч берём через `hour12: true`; для 24 ч — `hourCycle: 'h23'`, чтобы получить `14`, а не `24`-часовой с ведущим нулём как в `h24`.

### 4. Безопасный для hydration рендер

Клиентский компонент `src/components/ui/timestamp.tsx`: на первом рендере (до монтирования) рендерит `<time dateTime={iso}>` без текста, после `useEffect` — форматированное значение из `useTimeFormat`. Так сервер и первый клиентский рендер совпадают (оба пусты), а расхождения локали/зоны не дают hydration-ошибки.

- Альтернатива: форматировать на сервере браузерной зоной хоста — неверно; отклонено.
- Замена `slice(0, 10)` на `<Timestamp value={createdAt} />` в `GroupDiscussions.tsx`, `GroupActivity.tsx`, `SocialFeed.tsx`/`feed.ts` сохраняет семантику момента события.

### 5. Управление в настройках

В `SettingsView.tsx` новая секция «Время»: `TimezoneSelect` (нативный `<select>` с опцией «Как в браузере» + список `Intl.supportedValuesOf('timeZone')`) и `HourCycleSelect` (24/12). Изменения пишутся в предпочтения и применяются немедленно через `PREFERENCES_EVENT` без перезагрузки.

- Fallback: если `Intl.supportedValuesOf` недоступен, показываем небольшой заданный список зон (включая браузерную).
- Даты просмотра (`watchedAt`) не трогаем — это `date`, а не момент времени.

## Risks / Trade-offs

- [Hydration-рассинхрон таймстампов] → рендер значения только после монтирования; на первом кадре текст пуст, на `<time>` остаётся машиночитаемый `dateTime`.
- [Огромный список тайм-зон в `<select>`] → приемлемо для нативного селекта; поисковый комбобокс не вводим (YAGNI).
- [Поддержка `Intl.supportedValuesOf`] → есть в современных браузерах и Node; при отсутствии — заданный fallback-список.
- [Формат 12 ч зависит от локали для день-периода] → день-период берём из `formatToParts`; порядок и разделители всё равно наши.
- [Несколько мест `slice(0, 10)`] → обязательно заменить все перечисленные; ревью по чек-листу.

## Migration Plan

- Только клиентские изменения; миграций и серверного кода нет.
- Порядок: форматтер и хук → компонент `Timestamp` → замена мест отображения → секция в настройках.
- Откат: убрать ключи предпочтений и компонент, вернуть `slice`; данные не затрагиваются.
