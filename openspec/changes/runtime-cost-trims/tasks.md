## 1. Prefetch по намерению и в простое (п.1)

- [x] 1.1 Убрать атрибут `prefetch` со ссылок оболочки в `src/components/layout/nav-links.tsx`; добавить программный `router.prefetch()` по `pointerenter`/`focus` пункта. unit-тест: наведение/фокус на пункт вызывает prefetch его маршрута, а отображение всех пунктов не запускает prefetch сразу; карточки каталога по-прежнему не префетчатся. **Уточнение:** на `Link` выставлен `prefetch={false}` — со снятым атрибутом Next 16 включал штатный автопрефетч видимых ссылок (пачка SSR при загрузке). Стенд-проверка на чистой сборке: при загрузке prefetch-запросов пунктов меню нет; hover/focus префетчит только один пункт; idle-прогрев прогревает остальные.
- [x] 1.2 Добавить последовательный прогрев оставшихся пунктов меню в idle-время браузера (`requestIdleCallback` с таймерным fallback), с отменой при размонтировании оболочки и без повторного запуска в её пределах. unit-тест: после idle прогреваются все пункты меню; активация непрогретого пункта уходит обычной навигацией (без prefetch).
- [x] 1.3 Проверить, что `staleTimes` из `navigation-performance` продолжает действовать и переходы по прогретым пунктам не создают нового полного SSR в пределах окна свежести; существующие тесты `nav-prefetch.test.tsx`, `navigation.test.tsx` проходят с адаптацией.

## 2. Кэш актора (п.2)

- [x] 2.1 Реализовать модульный кэш `resolveActor` в `src/modules/auth/actor.ts`: `Map` по id пользователя с TTL ≤60 с, чтение `findUserById` при промахе. unit-тест: повторные вызовы в пределах TTL не ходят в БД (мок `query` со счётчиком), после TTL — ходят.
- [x] 2.2 Добавить сброс записи актора при мутациях, меняющих `users` (как минимум `PATCH /api/me/identity` в `src/app/api/me/identity/route.ts`); unit-тест: после смены имени/ника следующий `resolveActor` возвращает новое значение, не дожидаясь TTL.
- [x] 2.3 Проверить контракт `platform/authorization`: роль и существование пользователя по-прежнему определяются БД (через кэш), значения из токена не участвуют в решении; unit-тесты `policy`, `identity-service`, `session-cookie` проходят; сценарий «удалённый пользователь теряет доступ в пределах TTL» покрыт тестом.

## 3. Кэш словаря жанров (п.3)

- [x] 3.1 Кэшировать список жанров из БД в памяти процесса (TTL ~10 мин) для обоих потребителей — `storedGenreMap`/`listGenres` в `src/modules/catalog/service.ts` и `GET /api/genres`; unit-тест: повторные чтения в пределах TTL не ходят в БД, ответ кэша совпадает с ответом БД; существующие `catalog.test.ts`, `catalog-routes.test.ts` проходят.

## 4. Cache-Control на `/api/genres` (п.4)

- [x] 4.1 Отдавать ответ `GET /api/genres` с заголовком `Cache-Control: private, max-age=3600` (в `src/app/api/genres/route.ts` или `src/core/http/responses.ts`); unit-тест: заголовок присутствует, `private` (ответ за авторизацией не кэшируется общими прокси), `max-age` не превышает 3600.

## 5. Учёт размера кэша TMDB по `payload_bytes` (п.5)

- [x] 5.1 Создать миграцию: колонка `payload_bytes` в `tmdb_cache` + одноразовый backfill `payload_bytes = octet_length(payload::text)`; verify `npm run db:migrate` и обратная миграция (удаление колонки). Проверено: миграция применяется, колонка `integer NOT NULL`, `payload_bytes = octet_length` совпадают (3 = 3); `db:rollback` удаляет колонку, повторный `db:migrate` восстанавливает.
- [x] 5.2 Записывать `payload_bytes` в `upsertCacheEntry` (`src/modules/catalog/cache-repository.ts`) тем же запросом; перевести `selectCacheUsageBytes` на `SUM(payload_bytes)` и `deleteOldestCache` на оконную сумму по `payload_bytes`; unit-тест: usage и порядок вытеснения совпадают с прежним поведением (по `octet_length`), тесты `catalog-cache-eviction`, `catalog-cache-repository` проходят.
- [x] 5.3 Проверить, что бюджет `vps-resource-budgets` сохранён: вытеснение только при превышении 100 МБ, останов на hysteresis ~90 МБ, свежие записи не вытесняются под бюджетом; `npm test` проходит.

## 6. `jit=off` для Postgres (п.7)

- [x] 6.1 Добавить `-c jit=off` в `command:` сервиса `db` в `docker-compose.yml`; verify `docker compose config` рендерит флаг, а после `docker compose up -d db` `SHOW jit` возвращает `off`.

## 7. Удаление `revalidatePersonalData` (п.8)

- [x] 7.1 Удалить `src/app/api/personal-revalidate.ts` и его вызовы из `src/app/api/records/route.ts` и `src/app/api/watchlist/route.ts`; unit-тесты `record-routes`, `watchlist-routes` (мок инвалидации убирается) проходят.
- [x] 7.2 Прогнать `tests/e2e/records-freshness.spec.ts` без изменений: сохранение/удаление записи отражается в других разделах без F5 (свежесть несёт общий стор); зафиксировать результат в задаче. **Результат:** `E2E_DB=1 npx playwright test tests/e2e/records-freshness.spec.ts` → 1 passed (на собранном приложении, мигрированной и seed'нутой БД).

## 8. Верификация

- [x] 8.1 Прогнать `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`; всё проходит.
- [ ] 8.2 Стендовая проверка: при загрузке страницы в Network нет пачки prefetch-запросов пунктов меню (единичные по hover + прогрев в простое); повторный поиск не создаёт SQL по жанрам; `docker stats` при активной навигации ниже прежних ~30% app / ~9% db; `SHOW jit` = `off`.
  - Проверено на чистой сборке (`npm run build` + `next start`, демо-логин): при загрузке `/` prefetch-запросов пунктов меню нет; `router.prefetch` по hover префетчит только один пункт; idle-прогрев префетчит оставшиеся пункты (в 2 HTTP-запроса на пункт: segment-tree + metadata — внутреннее поведение Next 16). Кэш жанров подтверждён unit-тестом (`catalog`/`catalog-genres-cache`: повторное чтение в пределах TTL не идёт в БД). `SHOW jit` = `off` подтверждён (см. 6.1). Сравнение `docker stats` app/db под активной навигацией требует ручного наблюдения на стенде — автоматически воспроизвести базовые ~30%/9% нельзя.
