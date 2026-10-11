## 1. Хранилище кэша

- [x] 1.1 Добавить миграцию `src/core/db/migrations/*_create_tmdb_cache.sql`: таблица `tmdb_cache` (числовой `id` identity PK, `cache_key text unique`, `payload jsonb`, `expires_at`, `created_at`, `updated_at`, индекс по `expires_at`) и обратный `down`; проверка — `npm run db:migrate` и `npm run db:rollback` проходят.
- [x] 1.2 Добавить репозиторий кэша в `src/modules/catalog/` (`select/upsert/deleteExpired`) через общий пул `src/core/db/pool.ts`; проверка — unit-тест на upsert + выборку + идемпотентность `ON CONFLICT`.
- [x] 1.3 Проверить чистку роста: удаление истёкших строк ключа при записи и свип по `expires_at`; unit-тест на удаление устаревших записей.

## 2. Read-through чтение TMDB

- [x] 2.1 Обернуть `searchRaw`/`detailRaw` в read-through: свежий hit → `payload` без сети; промах/истёк → TMDB, успех → upsert, сбой/таймаут → последнее известное значение истёкшей строки. Убрать неограниченный in-memory `TtlCache` из `src/modules/catalog/service.ts`.
- [x] 2.2 Формировать детерминированный `cache_key` (kind + нормализованные query/genre/year/page + язык); unit-тест на стабильность ключа.
- [x] 2.3 Unit-тесты на все ветки: hit, miss, expired→fetch, stale-on-error (TMDB падает и есть истёкшая строка), отсутствие строки → ошибка.
- [x] 2.4 Проверить, что кэш не создаёт записей каталога: интеграционный тест — после поиска/открытия детали таблица доменного каталога пуста.

## 3. Стриминг секций

- [x] 3.1 Главная (`src/app/(app)/page.tsx`): вынести «Популярное» и «Ленту» в async-серверные компоненты под `<Suspense>` со скелетоном; проверка — unit на то, что оболочка и `SearchField` рендерятся до медленной секции.
- [x] 3.2 Детали (`film/[tmdbId]`, `series/[tmdbId]`): вернуть оболочку сразу, блок детали стримить под `<Suspense>`, перенести `notFound()` внутрь async-секции; проверка — тест на 404 и на появление скелета до контента.
- [x] 3.3 Списки (`films`, `series`): отдавать оболочку сразу, per-user секции стримить; проверка — `npm run typecheck` и unit-тест страниц.

## 4. Проверка

- [x] 4.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят без ошибок.
- [x] 4.2 Наблюдаемое поведение: повторный заход по прогретому кэшу открывается без ожидания TMDB; при остановленном TMDB страница отдаёт последнее известное значение; оболочка появляется раньше медленной секции (e2e или ручная проверка).
