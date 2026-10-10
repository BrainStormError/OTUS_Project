# 07. Деплой, конфигурация и наблюдаемость

## Принципы

1. Образ собирается вне целевого хоста; хост только запускает.
2. Одна стратегия деплоя — не смешивать платформы.
3. Конфигурация — только через env; секреты не в образе.
4. Каждый запрос трассируется `request-id`; каждый сбой виден в логах.
5. Есть health/readiness для внешнего монитора.

## Dockerfile (фактический)

Многоступенчатый: `deps` (`npm ci`) → `migrator` (образ миграций) → `build`
(`next build`, контекст с build-time заглушками env) → `runner`
(`.next/standalone`, непривилегированный пользователь `nextjs`, `node server.js`).

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Образ миграций (`--target migrator`) содержит только `node-pg-migrate` и `scripts/migrate.cjs`
(без полного `node_modules`), поэтому он занимает десятки МБ, а не гигабайты.

## docker-compose (фактический)

```yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 10s
      timeout: 5s
      retries: 10
  app:
    image: learn-watcher-platform:${IMAGE_TAG:-latest}
    depends_on:
      db: { condition: service_healthy }
    ports:
      - '127.0.0.1:3000:3000'   # только через reverse proxy
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://127.0.0.1:3000/api/health || exit 1']
```

У проекта задан `name: learn-watcher-platform`, потому что имя каталога не ASCII; из него
выводятся имена сети (`learn-watcher-platform_default`) и тома (`learn-watcher-platform_db_data`).
Смена имени проекта создаёт **пустой том**, поэтому первый деплой обязан включать шаг миграций:
`scripts/deploy.sh` сначала поднимает `db` (`docker compose up -d --wait db`, что также создаёт
сеть `learn-watcher-platform_default`), затем выполняет `migrate`, затем `up`.

## CI/CD (`.github/workflows/ci-cd.yml`)

```
push/PR → checks: typecheck, lint, deps, verify:env, unit, integration, audit, build
       → (master) build: образы app + -migrate локально (load: true), без GHCR
       → (master) deliver: docker save app -migrate | gzip | ssh 'gunzip | docker load'
       → (master) deploy: save previous → db → migrate → up, rollback on failure
```

Обязательные шаги:
- `checks` — блокируют всё.
- `build` — собирает `runner` и `migrator` (`--target migrator`) с `load: true` и
  доставляет их на хост по SSH; шагов логина/публикации в реестр нет.
- `deploy` — прогоняет `scripts/deploy.sh` на хосте с пустыми `IMAGE_REF`/`MIGRATE_IMAGE_REF`
  и локальными тегами `learn-watcher-platform[:latest]` / `learn-watcher-platform-migrate:latest`
  (образы уже загружены); сохраняет `previous` для отката.
- `concurrency` — отмена устаревших запусков на ветке; `deploy-production` — без отмены.

## Хостовый деплой (VPS + Caddy)

За пределами репозитория:
- Каталог деплоя на VPS — из секрета `DEPLOY_DIR` (например `/opt/watcher-platform`);
  CI создаёт его, доставляет туда `docker-compose.yml` и запускает `scripts/deploy.sh`
  из этого каталога.
- Хостовый `.env` (в каталоге `DEPLOY_DIR`) с `APP_ORIGIN=https://learn-watcher-platform.duckdns.org`, `DATABASE_URL`/
  `POSTGRES_*`, `SESSION_SECRET`, `REGISTRATION_TICKET_SECRET`, Google `OAUTH_CLIENT_ID`/
  `OAUTH_CLIENT_SECRET` и `TMDB_ACCESS_TOKEN` (**API Read Access Token**, длинный `eyJ...`).
  `scripts/deploy.sh` подгружает этот `.env` перед миграциями.
- `APP_ORIGIN` выставляет `Secure`-cookie сессии (см. `auth.ts`).
- Сайт-блок Caddy для TLS и SSE-ленты (`flush_interval -1` убирает буферизацию ответа):

  ```caddyfile
  learn-watcher-platform.duckdns.org {
      reverse_proxy 127.0.0.1:3000 {
          flush_interval -1
      }
  }
  ```

- DuckDNS A-запись `learn-watcher-platform` → IP VPS; открыты порты 80/443; в Google OAuth
  добавлен redirect URI `https://learn-watcher-platform.duckdns.org/api/auth/callback/google`.
- После успешного деплоя `scripts/deploy.sh` чистит dangling-образы (`docker image prune -f`),
  чтобы ограниченный диск VPS не забивался старыми сборками.

## Конфигурация окружения

`.env.example` (имена без значений секретов):

```
DATABASE_URL=
APP_ORIGIN=
SESSION_SECRET=
REGISTRATION_TICKET_SECRET=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
TMDB_ACCESS_TOKEN=
DEMO_LOGIN=0
LOG_LEVEL=info
```

Правила:
- Прод не стартует при неполной конфигурации (см. `core/config/env.ts` + `instrumentation.ts`).
- Схема env сверяется с `.env.example` в CI (`npm run verify:env`).

## Наблюдаемость

- Единый `entry`-лог: `level`, `event`, `at`, поля; редактирование ключей
  `secret|session|token|ticket|password|credential`; санитайз control-символов.
- `request-id` в каждой записи, связанной с запросом.
- `/api/health` — readiness (200 ok / 503 unavailable, таймаут 2с).

## Откат

`scripts/deploy.sh` сохраняет предыдущий образ под тегом `previous`; при сбое
миграции/`up` срабатывает `trap` и образ откатывается. Детали и dry-run — в
`README.md` и `docs/09-runbook-health.md`.

## Метрики (минимум)

- Задержка и код ответа по маршрутам.
- Число отказов авторизации (аномалии).
- Ошибки БД/таймауты.
- Ключевые бизнес-события (взнос, изменение суммы) — как счётчики.
