## 1. Права доступа

- [x] 1.1 Добавить экшены `group:leave` (разрешён члену, `groupRole === 'member'`) и `group:delete` (`groupRole === 'admin'`) в `src/core/auth/policy.ts`; unit `tests/unit/policy.test.ts` покрывает разрешение и отказ для каждого.
- [x] 1.2 Проверить `npm run test` (unit policy) зелёный и `npm run typecheck` чистый.

## 2. Выход из группы

- [x] 2.1 Сервис `leaveGroup(actor, { groupId })` в `src/modules/groups/service.ts`: отказ без роли, отказ администратору (`FORBIDDEN`), иначе удаление участия; integration `tests/integration/group-members.test.ts` — участник выходит, повторный выход отклонён, админ не может выйти.
- [x] 2.2 Ручка `DELETE /api/groups/[id]/membership` через `withRoute`; unit маршрута + integration на анонимный отказ.
- [x] 2.3 UI: кнопка «Покинуть группу» для не-админа на странице группы; unit `tests/unit/group-components.test.tsx`, e2e выход из группы.

## 3. Запрет самоисключения

- [x] 3.1 В `removeGroupMember` (`service.ts`) отклонять `input.userId === actor.id` (`FORBIDDEN`) независимо от числа админов; integration в `tests/integration/group-members.test.ts` — админ не может удалить себя.
- [x] 3.2 `AdminMemberPanel.tsx` не показывает действие удаления для собственной строки администратора; unit `tests/unit/group-components.test.tsx`.

## 4. Роспуск группы

- [x] 4.1 Repository `deleteGroupActivity(tx, groupId)` и `deleteGroup(tx, groupId)` в `src/modules/groups/repository.ts`; integration `tests/integration/group-members.test.ts` — после роспуска нет `groups`, `group_members`, `group_invitations`, `ratings` с `group_id`, `group_discussions`/`discussion_posts`, `activity_events` группы.
- [x] 4.2 Сервис `dissolveGroup(actor, { groupId })` (`service.ts`): проверка `group:delete`, транзакция — сначала удаление событий группы, затем группы; integration — не-админ получает отказ, группа не изменена.
- [x] 4.3 Ручка `DELETE /api/groups/[id]` через `withRoute`; unit маршрута; после роспуска `getGroup` отдаёт `NOT_FOUND`.
- [x] 4.4 UI: действие «Распустить группу» с подтверждением в админ-панели/настройках, после успеха `router.push('/groups')`; unit `tests/unit/group-components.test.tsx`, e2e роспуск группы.

## 5. Обратная связь по приглашению

- [x] 5.1 `AdminMemberPanel.tsx`: состояние отправленных приглашений (инициализация из `invitations`, добавление при клике), кнопка «Отправлено» с `disabled` для уже приглашённых; повторная отправка недоступна; unit `tests/unit/group-components.test.tsx`.

## 6. Хранение активности

- [x] 6.1 Repository `pruneStaleActivityEvents()` (`src/modules/activity/repository.ts`): `DELETE FROM activity_events WHERE created_at < now() - interval '1 day'`; вызывается перед выборкой в `listFeedEvents` и `listGroupFeedEvents` с throttle раз в минуту на процесс; integration `tests/integration/activity.test.ts` — событие старше суток удалено и не возвращается, свежее остаётся.
- [x] 6.2 Профиль: `buildProfile` (`src/modules/profiles/service.ts`) фильтрует `recent` по `createdAt >= now - 7 дней`, статистика считается по всем `entries`; integration `tests/integration/profiles.test.ts` — старая запись отсутствует в `recent`, но учтена в статистике.

## 7. Финальная проверка

- [x] 7.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration`, `npm run deps:check` проходят; e2e (выход, роспуск, приглашение) зелёные.
- [x] 7.2 Проверить, что спеки изменились согласованно: `openspec validate --specs` без ошибок после архивации (при применении).
