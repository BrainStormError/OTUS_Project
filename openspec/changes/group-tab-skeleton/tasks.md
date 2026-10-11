## 1. Панели вкладок

- [x] 1.1 Вынести забор данных вкладок из `src/app/(app)/groups/[id]/page.tsx` в асинхронные серверные компоненты `DiscussionsPanel`, `RatingsPanel`, `ActivityPanel` (`src/components/features/movie-tracker/GroupTabPanels.tsx`); «Участники» и «Статистика» оставить лёгкими. Проверить `npm run typecheck` и unit `tests/unit/pages.test.tsx`.
- [x] 1.2 Обернуть панель в `<Suspense key={active} fallback={<GroupTabSkeleton tab={active} />}>`, оставив шапку и `GroupTabs` вне границы; unit-тест, что при активной вкладке отдаётся fallback до появления контента.
- [x] 1.3 Реализовать `GroupTabSkeleton` (`src/components/features/movie-tracker/GroupTabSkeleton.tsx`) с формой под каждую вкладку на базе `src/components/ui/skeleton.tsx`; unit-тест форм скелета.
- [x] 1.4 Убедиться, что серверные проверки доступа сохранены на каждой панели (каждый сервис вызывает `canViewGroup`); integration `tests/integration/group-access.test.ts` зелёный.

## 2. Финальная проверка

- [x] 2.1 `npm run lint`, `npm run typecheck`, `npm run test` проходят; e2e `group-discussions` подтверждает, что шапка/вкладки остаются видимыми и показывается скелет при переключении.
