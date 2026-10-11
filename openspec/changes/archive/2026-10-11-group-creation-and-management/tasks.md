## 1. Миграции данных

- [x] 1.1 Миграция: identity для `tags.id` (старт выше текущего максимума), снять `tags_name_key` и создать уникальный индекс `lower(name)`, `CREATE UNIQUE INDEX groups_name_key ON groups (lower(name))`. Проверить `npm run db:migrate` и `tests/integration/migrations.test.ts`.
- [x] 1.2 Миграция: таблица `group_invitations` (id identity, group_id, inviter_id, invitee_id, status 0/1/2, timestamps, `UNIQUE(group_id, invitee_id)`, `CHECK(inviter_id <> invitee_id)`) и индексы; проверить `npm run db:migrate`.
- [x] 1.3 Убедиться, что `npm run db:seed` не конфликтует с новыми ограничениями (существующие группы/теги валидны); `npm run test:integration` (`db.test.ts`) зелёный.

## 2. Создание и настройки группы

- [x] 2.1 Zod-схемы `createGroupInput` и `updateGroupInput` (name trim 1..100, description ≤1000 optional, tags — массив строк ≤80, restricted boolean) в `src/modules/groups/schema.ts`; unit-тест схем.
- [x] 2.2 Repository: `insertGroup`, `updateGroupRow`, `resolveTagIds(tx, names)` (регистронезависимый upsert в `tags`, возврат id-кодов); integration `tests/integration/groups.test.ts`.
- [x] 2.3 Policy: добавить `group:create` (любой аутентифицированный), `group:update` (admin по `groupRole`) в `src/core/auth/policy.ts`; unit `tests/unit/policy.test.ts`.
- [x] 2.4 Сервисы `createGroup` (транзакция: группа + создатель как admin + теги) и `updateGroup` (проверка права, транзакция update + теги) с маппингом `23505` в `CONFLICT`; integration: создание, дубликат имени по регистру, смена видимости/тегов.
- [x] 2.5 Ручки `POST /api/groups` и `PATCH /api/groups/[id]` через `withRoute`; unit-тесты маршрутов (`tests/unit/group-routes.test.ts`) + integration на анонимный отказ.

## 3. Участники и роли

- [x] 3.1 Repository: смена роли и удаление участника; сервисы `changeGroupRole`, `removeGroupMember` с правом `group:manage` и защитой «нельзя убрать последнего администратора»; integration `tests/integration/group-members.test.ts`.
- [x] 3.2 Ручки `PATCH /api/groups/[id]/members/[userId]` и `DELETE` через `withRoute`; unit-тесты + проверка отказа не-админу.

## 4. Приглашения

- [x] 4.1 Repository приглашений: upsert pending (переоткрытие после declined), выборка по invitee со статусом pending (join группы и приглашающего), смена статуса, удаление; integration `tests/integration/group-invitations.test.ts`.
- [x] 4.2 Policy `group:invite` (admin); сервисы `inviteToGroup` (отказ, если уже участник; идемпотентность pending), `listMyInvitations`, `respondInvitation` (только invitee; accept в транзакции ставит status и добавляет участника), `cancelInvitation` (admin); unit `policy` + integration: accept даёт доступ к закрытой группе, до accept контент недоступен (`tests/integration/group-access.test.ts`).
- [x] 4.3 Ручки `POST /api/groups/[id]/invitations`, `POST /api/groups/invitations/[id]`, `DELETE /api/groups/invitations/[id]`; unit-тесты маршрутов.

## 5. Интерфейс

- [x] 5.1 Компонент `TagInput` (чипы, добавление/удаление, регистронезависимый дедуп) + unit-тест.
- [x] 5.2 `CreateGroupModal` (имя/описание/теги/радио открытая-закрытая) и кнопка «Создать группу» в `GroupsView.tsx`; после успеха `router.push('/groups/'+id)`, ошибка дубликата — в модалке; unit `tests/unit/screens.test.tsx`.
- [x] 5.3 Блок входящих приглашений `GroupInvitations` на странице групп (принять/отклонить); unit-тест.
- [x] 5.4 `GroupSettingsForm` (имя/описание/теги/видимость) на `/groups/[id]/admin`; unit-тест.
- [x] 5.5 Оживить `AdminMemberPanel.tsx`: поиск человека через существующий поиск → приглашение, смена роли, удаление, список pending с отзывом; unit-тест; e2e создание группы + вступление по приглашению в закрытую группу.

## 6. Финальная проверка

- [x] 6.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят; e2e (`group-access`, `critical-path`) зелёные; `npm run deps:check` без нарушений границ модулей. (Локально: lint 0 errors/2 warnings, typecheck чисто, 399 unit / 141 integration, deps:check чисто; e2e `group-access` и новый `group-creation` зелёные. Два теста `critical-path` на поиск требуют живого TMDB-токена и проверяются на сервере.)
