# 02. Архитектура: слои, границы, потоки

## Слои

```
Presentation (app/, components/)
        │ вызов (RSC) / HTTP (мутации)
Application (modules/*/service.ts)   ← сценарии, оркестрация, транзакции
        │
Domain (modules/*/domain.ts, policy.ts, schema.ts)   ← чистые правила и валидация
        │
Data access (modules/*/repository.ts)
        │
Infrastructure (core/db, core/config, core/log, core/http)
        │
PostgreSQL / внешние системы
```

## Ответственность слоёв

| Слой | Отвечает | НЕ отвечает |
| --- | --- | --- |
| `app/` | маршрутизация, авторизация маршрута, композиция RSC | бизнес-логика, SQL |
| `components/` | отображение и интерактив | доступ к БД, права |
| `modules/*/service.ts` | сценарий, транзакция, вызов политики и репозитория | HTTP-детали |
| `modules/*/domain.ts` | чистые функции правил | I/O |
| `modules/*/policy.ts` | правила допуска | запросы к БД |
| `modules/*/repository.ts` | SQL, маппинг строк | решения о правах |
| `core/*` | инфраструктура | знание о домене |

## Шаблон модуля

```
modules/directory/
├── types.ts        # доменные типы модуля
├── schema.ts       # zod-схемы входа/выхода (общие для клиента и сервера)
├── domain.ts       # чистые правила (курсоры, границы)
├── policy.ts       # can...(actor, resource)
├── repository.ts   # SQL + маппинг
├── service.ts      # сценарии, транзакции
└── index.ts        # публичный API модуля
```

Пример `service.ts` (создание записи справочника):

```ts
// modules/directory/service.ts
import { withTransaction } from '@/core/db/transaction';
import { canCreateEntry } from './policy';
import { insertEntry } from './repository';

export async function createDirectoryEntry(actor: Actor, input: CreateEntryInput) {
  if (!canCreateEntry(actor)) return err('FORBIDDEN', 'Нет прав');
  const entry = await withTransaction((tx) => insertEntry(tx, { ...input, ownerId: actor.id }));
  return ok(entry);
}
```

## Модель результата (без «магии» исключений)

```ts
// core/result.ts
export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; code: ErrCode; message: string };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (code: ErrCode, message: string): Err => ({ ok: false, code, message });
```

Правила:
- Ожидаемые отказы (валидация, права, бизнес-правила) → `Result`, не исключения.
- Непредвиденные сбои (БД недоступна) → исключение → `withRoute` логирует и отвечает 500.

## Когда RSC, когда Route Handler

| Операция | Механизм |
| --- | --- |
| Чтение данных для страницы | RSC → `service.ts` напрямую |
| Форма/мутация | Client island → `fetch('/api/...')` → Route Handler → `service.ts` |
| Health/readiness | Route Handler |
| OAuth callback | Route Handler (framework) |
| Server Action | Допустимо для форм, если нет нужды в отдельном API; правила те же |

## Типичный поток мутации

`withRoute` (`core/http/with-route.ts`) — единый контракт: request-id → origin (403) →
сессия (401) → rate-limit (429) → размер тела (413) → zod (400) → handler →
маппинг `Result` в HTTP → непредвиденное (500, без деталей).

Обратите внимание: `withRoute` живёт в `core` и не импортирует `modules`. Резолвер
актора инжектируется из app-слоя (`resolveActor: getActor`), что сохраняет правило
`core -/-> modules`.

## Правила модуля

1. Наружу экспортируется только `index.ts` (сервис + типы + схемы).
2. Репозиторий виден только своему сервису.
3. Политика не делает запросов; ресурсы передаются ей готовыми.
4. Транзакции открывает сервис, не репозиторий.
5. Один сценарий — один публичный метод сервиса.
