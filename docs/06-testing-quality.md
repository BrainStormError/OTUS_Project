# 06. Тестирование и качество

## Пирамида

```
E2E (Playwright) — мало, критичные пути
Integration (Vitest + Testcontainers) — repository + сервисы с реальным Postgres
Unit (Vitest) — домен, политика, схемы, утилиты
```

## Что чем покрывать

| Слой | Тип теста | Пример в проекте |
| --- | --- | --- |
| `domain.ts`, `policy.ts`, `schema.ts` | unit | таблица истинности `can(...)` (100% ветвей), границы zod |
| `repository.ts`, транзакции | integration | commit/rollback, пагинация с курсором |
| `service.ts` | unit с моками + integration | создание записи, отказ по правам |
| Route Handler | unit | 401/403/400/200, origin guard, rate limit |
| UI-компоненты | component (Testing Library) | состояния loading/empty/error/success |
| Критичные пути | e2e | вход → чтение → мутация |

## Гейты CI (блокирующие)

```
npm run typecheck
npm run lint
npm run deps:check          # правила зависимостей
npm run verify:env          # схема env == .env.example
npm test                    # unit
npm run test:integration    # testcontainers
npm run audit               # npm audit --omit=dev --audit-level=high
npm run build
```

E2E — на PR в основную ветку и nightly; критичный путь дополнительно.

## Тестовые конфигурации

- `vitest.config.ts` — unit/component: `jsdom`, Testing Library, `esbuild.jsx = automatic`.
- `vitest.integration.config.ts` — `node`, `globalSetup` поднимает один
  Testcontainers PostgreSQL (`tests/integration/global-setup.ts`), накатывает миграции и
  пишет строку подключения в `tests/integration/.db-url.json`; `setupFiles` проставляет
  `process.env` в воркере. `maxWorkers: 1`, `fileParallelism: false` — общий пул.
- `playwright.config.ts` — `webServer: npm run start`, база `http://127.0.0.1:3000`.

## Правила тестов

1. Тест описывает поведение, не реализацию.
2. Никаких обращений к реальной БД в unit-тестах.
3. Integration-тесты изолированы: свежий контейнер (схема) на прогон.
4. Фикстуры даты фиксированы (домен дат — детерминированный).
5. Каждый баг сначала воспроизводится тестом, потом фиксится.

## Планка покрытия

- `domain/` и `policy/` — **100% ветвей** (маленькие чистые функции).
- `service/` — основные сценарии и отказы.
- Общий порог — не самоцель; важнее покрытие правил, а не процентов.

## Definition of Done (фича)

- [ ] Код проходит lint + typecheck + deps:check.
- [ ] Есть unit-тесты на новые правила и схемы.
- [ ] Есть integration-тест, если затронута БД/транзакция.
- [ ] Обновлены спецификация/документация при изменении поведения.
- [ ] Проверены состояния loading/empty/error.
- [ ] Тексты интерфейса согласованы с фактической политикой (нет расхождений FAQ↔код).
