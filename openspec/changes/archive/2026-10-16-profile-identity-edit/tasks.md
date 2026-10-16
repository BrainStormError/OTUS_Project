## 1. Данные и серверная логика

- [x] 1.1 Добавить миграцию `users.handle_changed_at timestamptz` (nullable) в `src/core/db/migrations`; проверить `npm run db:migrate` и `npm run test:integration` (`tests/integration/migrations.test.ts` зелёный).
- [x] 1.2 Добавить zod-схему `identityUpdateInput` (`name?` trim 1..100; `handle?` trim `^[a-z0-9_-]{1,50}$`, не `admin`/`root`; хотя бы одно поле) в `src/modules/auth/schema.ts`; добавить unit-тест схемы (`tests/unit/identity-schema.test.ts`) — валидные/невалидные значения, reserved, длина.
- [x] 1.3 Добавить в `src/modules/auth/repository.ts` функцию обновления личности с условным `UPDATE` по кулдауну (`handle_changed_at IS NULL OR handle_changed_at <= now() - interval '1 month'`), записью `handle_changed_at = now()` при смене тэга, без его изменения при no-op; маппинг `23505` в конфликт. Проверить unit/integration `tests/integration/auth.test.ts`.
- [x] 1.4 Добавить сервис `updateIdentity(actor, input): Result<{name,handle}>` в `src/modules/auth/identity.ts` (только владелец; понятные ошибки: формат, reserved, занято, кулдаун с остатком; отправка текущего тэга — успешный no-op); покрыть unit-тестом `tests/unit/identity-service.test.ts`.
- [x] 1.5 Экспортировать схему и сервис из `src/modules/auth/index.ts`/`users.ts` по принятой границе, чтобы ручка не тянула лишнее; `npm run typecheck` зелёный.
- [x] 1.6 Добавить ручку `PATCH /api/me/identity` (`src/app/api/me/identity/route.ts`) через `withRoute` с `schema: identityUpdateInput`, `resolveActor`, `rateLimit`; unit-тест маршрута `tests/unit/identity-route.test.ts` и integration на успех/ошибки.

## 2. Интерфейс

- [x] 2.1 Создать клиентский компонент модалки редактирования имени/тэга на базе `Modal`/`Input`/`Button` с отображением серверных ошибок; unit-тест рендера и отправки.
- [x] 2.2 Вынести шапку своего профиля в клиентский `EditableIdentity` (карандаш у имени и у тэга) и использовать её в `ProfileView.tsx` только при `isOwn`; unit-тест: для чужого профиля карандашей нет.
- [x] 2.3 Добавить в `SettingsView.tsx` кнопки «Изменить имя» и «Изменить тэг», открывающие те же модалки; unit-тест `tests/unit/screens.test.tsx`.
- [x] 2.4 После успешного сохранения вызывать `router.refresh()`; при смене тэга в своём профиле по адресу `/u/<handle>` переходить на `/me`. Проверить вручную/unit-тестом.

## 3. Финальная проверка

- [x] 3.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят; e2e-сценарий правки профиля (имя и тэг) добавлен и зелёный, существующие e2e не регрессируют.
