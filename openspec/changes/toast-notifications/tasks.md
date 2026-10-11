## 1. Основа тостов

- [x] 1.1 Добавить `@radix-ui/react-toast` в `package.json` и установить; `npm ls @radix-ui/react-toast` показывает установленную версию, `npm run build` проходит.
- [x] 1.2 Создать `src/components/ui/toast.tsx`: `ToastProvider` + `ToastViewport`, хук `useToast() -> { success(message), error(message) }`, тональность через иконку+текст, `destructive`-токен для ошибки и нейтральную карточную поверхность для успеха; unit-тест `tests/unit/toast.test.tsx` — показ success и error, закрытие, авто-скрытие.
- [x] 1.3 Смонтировать провайдер и вьюпорт в `src/app/(app)/layout.tsx` вокруг `children`; проверка: после любого вызова `useToast()` тост отображается, unit/поведенческий тест провайдера зелёный.

## 2. Привязка к мутациям

- [x] 2.1 Записи: показывать тост по итогу сохранения/удаления в `RecordModal.tsx`/`report-rating.ts`/`FilmDetail.tsx`; unit-тест — успех даёт success-тост, ошибка сети/сервера даёт error-тост.
- [x] 2.2 Обсуждения группы: тост при создании темы и отправке комментария в `GroupDiscussions.tsx`; существующие inline-ошибки сохраняются; unit-тест.
- [x] 2.3 Друзья: перевести помощники `social-actions.ts` на возврат `Promise`, в `FriendsView.tsx` показывать тост и откатывать оптимистичный стейт при ошибке (заявка, принятие, отклонение, отмена); обновить существующие unit-тесты `social-actions`.
- [x] 2.4 Приватность: тост по итогу сохранения в `SettingsView.tsx`/`PrivacyToggle.tsx`, `SaveStatus` сохраняется; unit-тест.
- [x] 2.5 Группы: тост для создания группы (`CreateGroupModal.tsx`), настроек/участников/инвайтов (`GroupSettingsForm.tsx`, `AdminMemberPanel.tsx`, `GroupInvitations.tsx`), оценок (`GroupRatings.tsx`), выхода/роспуска (`LeaveGroupButton.tsx`, `DissolveGroupButton.tsx`); ревью по чек-листу мутаций, unit-тесты на 1–2 представителя.

## 3. Финальная проверка

- [x] 3.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят; добавлен e2e-сценарий: успешное сохранение записи показывает success-тост, неуспешная операция показывает error-тост; существующие e2e не регрессируют.
