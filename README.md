# Movie Tracker

Инженерный фундамент проекта на Next.js: слоистая архитектура (`app -> modules -> core`),
PostgreSQL через `pg` без ORM, `zod`-границы, Auth.js, обязательные проверки качества
и один вертикальный срез (`directory`) как эталон модуля.

Полный гайд по соглашениям — в `GUIDE.md` и `docs/01`–`docs/09`.

## Стек

Версии зафиксированы точно в `package.json` (см. раздел «Стек (зафиксированные версии)» в `GUIDE.md`).

| Слой | Выбор | Версия |
| --- | --- | --- |
| Framework | Next.js (App Router, Turbopack, `output: 'standalone'`) | 16.3.8 |
| UI | React / React DOM | 19.3.0 |
| Язык | TypeScript strict (`strict`, `noUncheckedIndexedAccess`) | 5.5.4 |
| UI | Tailwind CSS | 4.3.3 |
| БД | PostgreSQL | 16 |
| Доступ к БД | `pg` (без ORM) | 8.23.1 |
| Миграции | `node-pg-migrate` | 7.6.1 |
| Валидация | `zod` | 3.25.76 |
| Аутентификация | Auth.js / NextAuth | 5.0.0-beta.32 |
| Тесты | Vitest / Testing Library / Testcontainers / Playwright | 5.0.3 / 16.3.3 / 12.2.0 / 1.63.0 |

Требования: Node.js >= 20.9, Docker (для integration-тестов и e2e), PostgreSQL 16.

## Быстрый старт

```bash
cp .env.example .env         # заполните значения (см. «Конфигурация»)
npm ci
docker compose up -d db      # локальная БД (или свой PostgreSQL)
npm run db:migrate           # накатить миграции
npm run dev                  # http://localhost:3000
```

Сквозной запуск в контейнерах:

```bash
docker compose up -d --build # БД + приложение, порт только на loopback
curl -fsS http://127.0.0.1:3000/api/health   # {"status":"ok"}
```

## Скрипты

| Команда | Назначение |
| --- | --- |
| `npm run dev` | dev-сервер Next.js |
| `npm run build` | production-сборка (`standalone`) |
| `npm run start` | запуск собранного приложения |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run deps:check` | правила зависимостей слоёв (`dependency-cruiser`) |
| `npm test` | unit/component-тесты (Vitest + Testing Library + jsdom) |
| `npm run test:integration` | интеграционные тесты (Testcontainers, реальный PostgreSQL) |
| `npm run test:e2e` | Playwright smoke-путь |
| `npm run test:e2e:critical` | Playwright критичный путь (нужен `E2E_DB=1` и БД) |
| `npm run verify:env` | сверка схемы env с `.env.example` |
| `npm run audit` | аудит production-зависимостей (`--omit=dev --audit-level=high`) |
| `npm run db:migrate` / `db:rollback` / `db:new` | миграции `node-pg-migrate` |

## Конфигурация

Все значения читаются только через `src/core/config/env.ts` (fail-fast). Имена — в `.env.example`:

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `NODE_ENV` | нет | `development` / `test` / `production` |
| `DATABASE_URL` | да | строка подключения PostgreSQL |
| `APP_ORIGIN` | да | публичный origin (без пути); из него выводится `Secure` cookie |
| `SESSION_SECRET` | да | >= 32 символов, подпись сессии |
| `REGISTRATION_TICKET_SECRET` | да | >= 32 символов, HMAC регистрационного ticket |
| `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` | да | OAuth-провайдер (Auth.js) |
| `DEMO_LOGIN` | нет | `1` включает demo-вход (course-окружение) |
| `LOG_LEVEL` | нет | `debug` / `info` / `warn` / `error` |

При неполной конфигурации приложение **не стартует** и не обслуживает запросы.

## Деплой

1. CI (`.github/workflows/ci-cd.yml`): блокирующие проверки на PR; на `main` — сборка и
   публикация образов `app` и `migrate` с тегами `sha` и `latest`.
2. `deploy` job по SSH выполняет `scripts/deploy.sh` на хосте:
   **save previous → deliver → migrate → up**.

```bash
IMAGE_REF=ghcr.io/<owner>/<repo>:<sha> \
MIGRATE_IMAGE_REF=ghcr.io/<owner>/<repo>:<sha>-migrate \
bash scripts/deploy.sh
```

Миграции выполняются отдельным образом (`--target migrator`) до старта нового контейнера.

## Откат

`scripts/deploy.sh` сохраняет предыдущий образ под тегом `birthday-platform:previous`.
При любом сбое (миграция, `up`) срабатывает `trap` и выполняется откат:

```
docker tag birthday-platform:previous birthday-platform:latest
docker compose up -d --no-build app
```

Проверка ветки отката без изменений на хосте:

```bash
DRY_RUN=1 SIMULATE_FAILURE=1 bash scripts/deploy.sh
```

Миграции обратимы: у каждой `up` есть `down` (`npm run db:rollback`).

## Документация

- `GUIDE.md` — исходный инженерный гайд.
- `docs/01`–`docs/08` — гайд, адаптированный под проект.
- `docs/09-runbook-health.md` — health/readiness и внешний uptime-монитор.
- `docs/adr/` — ADR по неочевидным решениям.

## Безопасность

- CSP с per-request nonce (`src/proxy.ts`), HSTS/`nosniff`/`Referrer-Policy` (`next.config.js`).
- Cookie сессии `HttpOnly` + `Secure` + `SameSite=Lax` с ограниченным TTL.
- Проверка `Origin`/`Sec-Fetch-Site` на мутациях, rate-limit и лимиты длин.
- Единая точка авторизации `core/auth/policy.ts::can(...)`; роль берётся из БД.
- `npm run audit` проверяет production-дерево (`--omit=dev`); оно чистое. Оставшиеся
  advisories находятся только в dev-toolchain (например, `braces` через `eslint-config-next`,
  апстрим-фикса нет) — см. `docs/adr/0005-production-scoped-audit-gate.md`.
