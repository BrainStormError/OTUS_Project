# 03. Данные: БД, миграции, сервисы, репозитории

## Принципы

1. Схема меняется **только** миграцией.
2. Доступ к БД — только через `repository.ts` своего модуля.
3. Сервис владеет транзакцией; репозиторий принимает `PoolClient` (`tx`).
4. Только параметризованный SQL; динамика — лишь статические константы модуля.
5. Единственный `pg.Pool` на процесс (`core/db/pool.ts`, мемоизирован в `globalThis`).

## Миграции

Инструмент: `node-pg-migrate` (SQL-миграции; язык определяется по расширению `.sql`).

```
src/core/db/migrations/
├── 1710000000000_init.sql              # users + уникальные индексы
└── 1710000000001_directory_entries.sql  # таблица справочника
```

Команды:

```jsonc
// package.json
{
  "scripts": {
    "db:migrate": "node-pg-migrate up -m src/core/db/migrations",
    "db:rollback": "node-pg-migrate down -m src/core/db/migrations",
    "db:new": "node-pg-migrate create -m src/core/db/migrations -j sql"
  }
}
```

Правила миграций:
- Идемпотентность (`IF NOT EXISTS`) там, где возможно.
- Обратимость: у каждой `up` есть `down` (`-- Down Migration`).
- Данные отделены от схемы (`db/seed/` только для демо).
- Ни при каких условиях не править уже применённую миграцию — только новая.
- В проде миграции накатывает отдельный образ (`Dockerfile --target migrator`).

## Модель денег (ledger) — заготовка для домена

Правильно для аудита и платежей:

```sql
CREATE TABLE contribution (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id     uuid NOT NULL REFERENCES users(id),
  recipient_id uuid NOT NULL REFERENCES users(id),
  amount       integer NOT NULL CHECK (amount > 0),
  status       text NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('pending','confirmed','refunded')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contribution_recipient_idx ON contribution (recipient_id, created_at DESC);

CREATE TABLE collection (
  recipient_id uuid PRIMARY KEY REFERENCES users(id),
  total_amount integer NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  gift_sent    boolean NOT NULL DEFAULT false
);
```

## Паттерн репозитория

```ts
// modules/directory/repository.ts
export async function insertEntry(tx: PoolClient, input: { name: string; description?: string; ownerId: string }) {
  const result = await tx.query<EntryRow>(
    `INSERT INTO directory_entries (name, description, owner_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, description, owner_id, created_at`,
    [input.name, input.description ?? null, input.ownerId],
  );
  const row = result.rows[0];
  if (!row) throw new Error('insertEntry returned no row');
  return mapEntry(row);
}
```

Правила репозитория:
- Экспорт только функций; никакого доменного решения внутри.
- Маппинг `snake_case → camelCase` локально (`mapX`).
- Именованные колонки в `RETURNING`, без `SELECT *`.
- Явные индексы под каждый реальный запрос списка.

## Границы и пагинация

- Каждый `list*` принимает `{ limit, cursor }` и возвращает `{ items, nextCursor }`.
- Жёсткий максимум `limit` в схеме (`MAX_LIMIT = 100`), дефолт `DEFAULT_LIMIT = 20`.
- Курсор — непрозрачная строка (`domain.ts::encodeCursor/decodeCursor`), выборка
  по `(created_at, id) < (?, ?)` с `ORDER BY created_at DESC, id DESC`.
- Списки в UI не тянут «всё» — это скрытый источник деградации.

## Обязательные индексы (проверять на каждом PR со схемой)

| Запрос | Индекс |
| --- | --- |
| Пользователь по email | `users(email)` (уникальный) |
| Пользователь по subject провайдера | `users(provider, provider_subject)` (уникальный) |
| Записи справочника | `directory_entries(created_at DESC, id DESC)` |
| Пожелания по получателю | `wishes(target_user_id, created_at DESC)` |
| Сообщения ветки | `chat_messages(thread_user_id, created_at)` |
| Взносы получателя | `contribution(recipient_id, created_at DESC)` |
