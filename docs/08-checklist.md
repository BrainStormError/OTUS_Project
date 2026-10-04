# 08. Чек-лист старта нового проекта

## Шаг 1. Каркас

- [x] Инициализировать Next.js (App Router, TypeScript, `src/`).
- [x] Включить `strict` и `noUncheckedIndexedAccess` в `tsconfig.json`.
- [x] Подключить Tailwind 4 + shadcn/ui.
- [x] Создать каталоги `src/{app,modules,core,components,types}`, `tests/{unit,integration,e2e}`, `db/seed`, `docs/`, `public/`.
- [x] Добавить `alias @/* → src/*`.

## Шаг 2. Инфраструктура

- [x] `core/config/env.ts` с zod-схемой; fail-fast через `instrumentation.ts`.
- [x] `core/db/pool.ts` (единственный `pg.Pool` на процесс) и `transaction.ts`.
- [x] Миграции (`node-pg-migrate`), первая миграция — `init` (users + индексы).
- [x] `core/log/logger.ts` + redaction + request-id.
- [x] `core/http/{responses,origin,with-route}.ts`, `core/http/{rate-limit,timeout}.ts`.
- [x] `core/result.ts`.

## Шаг 3. Безопасность

- [x] CSP с per-request nonce (`src/proxy.ts`, Next 16).
- [x] HSTS / nosniff / Referrer-Policy в `next.config.js`.
- [x] Auth.js v5 с OAuth + demo-вход, `HttpOnly`+`Secure`+`SameSite=Lax`, ограниченный TTL.
- [x] `core/auth/policy.ts::can(...)` с таблицей истинности (100% ветвей).
- [x] `originGuard` на всех мутациях (`withRoute`).
- [x] Rate limit и лимиты длин.

## Шаг 4. Первый вертикальный срез

- [x] Модуль `directory` (чтение справочника) по шаблону.
- [x] Одна RSC-страница, читающая через `service.ts`.
- [x] Одна мутация через Route Handler (с zod + policy).
- [x] Компоненты loading/empty/error.

## Шаг 5. Качество

- [x] Vitest + Testing Library + jsdom.
- [x] Testcontainers для integration.
- [x] Playwright для e2e.
- [x] `dependency-cruiser` + `npm run deps:check`.
- [x] CI: lint, typecheck, deps, unit, integration, audit, build — блокирующие.

## Шаг 6. Деплой и эксплуатация

- [x] Многоступенчатый `Dockerfile` (`standalone`, образ `migrator`).
- [x] `docker-compose.yml` с healthcheck БД и привязкой порта к loopback.
- [x] CI/CD: build → save previous → deliver → migrate → up → rollback.
- [x] `/api/health` + внешний uptime-монитор (`docs/09-runbook-health.md`).
- [x] `.env.example` со всеми именами переменных.

## Шаг 7. Документация

- [x] `README.md`: стек, запуск, конфигурация, деплой, откат.
- [x] `docs/` — этот гайд, адаптированный под проект.
- [x] Спецификации поведения (OpenSpec) для ключевых сценариев.
- [x] ADR на каждое неочевидное решение (`docs/adr/`).

## Мини-шаблон новой фичи (порядок работы)

1. Спецификация/ADR: что и почему.
2. Миграция схемы (если нужны данные).
3. `types.ts` → `schema.ts` (zod) → `domain.ts` (правила) → `policy.ts` (права).
4. `repository.ts` (SQL) → `service.ts` (сценарий + транзакция).
5. Route Handler для мутации (тонкий) / RSC для чтения.
6. Компоненты (ui → feature), состояния loading/empty/error.
7. Тесты: unit (правила) → integration (БД) → e2e (путь).
8. Обновить документацию и чек-лист доступности.
