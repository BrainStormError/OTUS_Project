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

Образ миграций (`--target migrator`) содержит `node-pg-migrate` и `scripts/migrate.cjs`.

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
    image: birthday-platform:${IMAGE_TAG:-latest}
    depends_on:
      db: { condition: service_healthy }
    ports:
      - '127.0.0.1:3000:3000'   # только через reverse proxy
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://127.0.0.1:3000/api/health || exit 1']
```

У проекта задан `name: birthday-platform`, потому что имя каталога не ASCII.

## CI/CD (`.github/workflows/ci-cd.yml`)

```
push/PR → checks: typecheck, lint, deps, verify:env, unit, integration, audit, build
       → (main) build image: tags sha + latest (+ -migrate)
       → (main) deploy: save previous → deliver → migrate → up, rollback on failure
```

Обязательные шаги:
- `checks` — блокируют всё.
- `build` — образы `app` и `migrate` с тегами `sha` и `latest`.
- `migrate` — отдельный образ до старта нового контейнера.
- `deploy` — не трогает `.env` и том; сохраняет `previous` для отката (`scripts/deploy.sh`).
- `concurrency` — отмена устаревших запусков на ветке; `deploy-production` — без отмены.

## Конфигурация окружения

`.env.example` (имена без значений секретов):

```
DATABASE_URL=
APP_ORIGIN=
SESSION_SECRET=
REGISTRATION_TICKET_SECRET=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
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
