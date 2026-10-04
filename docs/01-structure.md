# 01. Структура проекта

## Дерево каталогов (фактическое)

```
project/
├── src/
│   ├── app/                       # только маршрутизация и композиция
│   │   ├── layout.tsx             # корневой layout
│   │   ├── globals.css            # токены темы, Tailwind v4
│   │   ├── page.tsx               # публичная заглушка
│   │   ├── (auth)/login/page.tsx  # RSC-обёртка + client-форма
│   │   ├── (app)/                 # защищённая зона (requireSession)
│   │   │   ├── layout.tsx         # getActor() -> redirect('/login')
│   │   │   ├── directory/         # page.tsx, loading.tsx, error.tsx
│   │   │   └── ...
│   │   └── api/                   # ТОЛЬКО мутации + health
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── directory/route.ts (+ route-factory.ts)
│   │       └── health/route.ts (+ health-factory.ts)
│   ├── modules/                   # bounded contexts
│   │   ├── auth/                  # auth.ts, session.ts, actor.ts, demo.ts, ticket.ts,
│   │   │                          # repository.ts, schema.ts, types.ts, index.ts
│   │   └── directory/             # {types,schema,domain,policy,repository,service,index}.ts
│   ├── core/
│   │   ├── db/                    # {pool.ts, transaction.ts, migrate.ts, migrations/}
│   │   ├── config/                # {env.ts}
│   │   ├── log/                   # {logger.ts, request-id.ts}
│   │   ├── http/                  # {responses.ts, origin.ts, with-route.ts, rate-limit.ts, timeout.ts}
│   │   ├── auth/                  # {policy.ts}   # can(actor, action, resource)
│   │   └── result.ts
│   ├── components/
│   │   ├── ui/                    # shadcn-обёртки, без бизнес-логики
│   │   ├── layout/                # header, footer, theme-switcher, banners
│   │   └── features/              # AsyncView, features/directory/*, features/auth/*
│   ├── types/                     # next-auth.d.ts
│   ├── instrumentation.ts         # fail-fast env на старте сервера
│   └── proxy.ts                   # CSP nonce (Next 16 proxy)
├── tests/{unit,integration,e2e}/
├── db/seed/                       # только демо-данные; схема — в миграциях
├── docs/                          # этот гайд
├── public/
├── .github/workflows/ci-cd.yml
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── next.config.js
├── eslint.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── vitest.integration.config.ts
├── playwright.config.ts
└── package.json
```

## Правила именования

| Объект | Соглашение | Пример |
| --- | --- | --- |
| Модуль домена | существительное, мн./ед. по смыслу | `directory`, `support` |
| Сервис | `<модуль>/service.ts`, экспорт `verbXxx` | `listDirectory()`, `createDirectoryEntry()` |
| Репозиторий | `<модуль>/repository.ts`, `find*/list*/insert*/update*` | `findUserById()` |
| Политика | `<модуль>/policy.ts` | `canCreateEntry(actor)` |
| Схема | `<модуль>/schema.ts`, zod | `createEntryInput` |
| RSC-страница | `page.tsx` | — |
| Клиентский компонент | `PascalCase.tsx` + `'use client'` | `DirectoryEntryForm.tsx` |
| Хук | `useXxx.ts` | `useAsyncAction.ts` |
| Миграция | `NNN_описание.sql` | `1710000000001_directory_entries.sql` |

## Правила зависимостей (enforce в CI)

```
app/  ──▶ modules/ ──▶ core/
components/ ──▶ modules/
core/   ✗▶ modules/ | components/
modules/X ✗▶ modules/Y/repository   (только modules/Y/service, а лучше index)
components/ui/ ✗▶ modules/
```

- `core/` **не импортирует** `modules/` и `components/`.
- `modules/X` не импортирует `modules/Y/repository.ts`; разрешён только публичный
  surface другого модуля (`index.ts`).
- `components/ui/` не импортирует ничего из `modules/`.
- Проверка: `dependency-cruiser` + `npm run deps:check` в CI (`.dependency-cruiser.cjs`).

## Конфигурация пути

`tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Правила размещения файлов

1. Новая предметная область → новый каталог в `src/modules/`.
2. Новая страница → `src/app/...` (RSC), интерактив выносится в `components/features/`.
3. Новая таблица/агрегат → миграция + репозиторий в соответствующем модуле.
4. Утилиты без домена → `core/`; утилиты отображения → `components/`.
5. Один публичный экспорт на файл-сервис допустим, но файл не смешивает сценарии разных агрегатов.
