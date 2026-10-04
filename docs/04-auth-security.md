# 04. Аутентификация, права и безопасность

## Модель аутентификации

- OAuth через внешний IdP (Auth.js v5 / NextAuth) + опциональный demo-вход.
- Идентичность привязывается к стабильному `subject` провайдера, не только к email.
- Сессия — `HttpOnly` + `Secure` + `SameSite=Lax` (`buildSessionCookieConfig`),
  ограниченный TTL (`SESSION_MAX_AGE_SECONDS = 30 дней`). `Secure` выводится из
  `APP_ORIGIN` (https), а не из «магии» `NODE_ENV`.
- Регистрация новых пользователей — через одноразовый подписанный ticket (HMAC),
  связка «ticket + сессия + совпадающий email».

## Сессия как единая точка

```ts
// modules/auth/session.ts
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  return resolveActor(session?.user?.id); // modules/auth/actor.ts
});

// modules/auth/actor.ts — роль из БД, не из токена
export async function resolveActor(userId?: string | null) {
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user) return null;
  return { id: user.id, role: user.role, email: user.email };
}
```

Правила:
- Роль берётся из БД, а не из клиента/токена (токен может быть устаревшим).
- `getActor` кэшируется на запрос (`react.cache`) — один SELECT на рендер.
- Удалённый пользователь теряет доступ на следующем запросе.

## Авторизация — единая политика

```ts
// core/auth/policy.ts
export type Action = 'wish:create' | 'wish:edit' | 'donation:change'
  | 'thread:read' | 'admin:view' | 'directory:create' | 'directory:edit';

export function can(actor: Actor, action: Action, resource?: Resource): boolean {
  switch (action) {
    case 'admin:view':
    case 'donation:change':
      return actor.role === 'admin';
    case 'thread:read':
      return actor.role === 'admin' || resource?.ownerId === actor.id;
    case 'wish:create':
      return true;
    case 'wish:edit':
      return actor.role === 'admin' || resource?.authorId === actor.id;
    case 'directory:create':
      return actor.role === 'admin';
    case 'directory:edit':
      return actor.role === 'admin' || resource?.ownerId === actor.id;
  }
}
```

Правила:
- Проверка прав — в `service` (источник истины) и, при необходимости, в RSC для UI.
- Никаких проверок ролей внутри `components/ui` и `repository`.
- Каждая ветка `can` покрыта unit-тестом (таблица истинности, 100% ветвей).

## Валидация границ

- Любой вход (тело, query, params) проходит zod на сервере.
- Схемы переиспользуются в клиентских формах (один контракт).
- Лимиты длин и диапазоны — часть схемы (`createEntryInput`, `listDirectoryInput`).

## Обёртка route и защита мутаций

`core/http/with-route.ts` — единый контракт мутаций: request-id, origin 403,
сессия 401, rate-limit 429, лимит тела 413, zod 400, маппинг `Result` → статус,
непредвиденное → 500 без деталей. Актор передаётся через `resolveActor` (инверсия
зависимости, чтобы `core` не знал о `modules`).

## Чек-лист безопасности (на каждый релиз)

- [ ] Параметризованный SQL везде; нет конкатенации пользовательских данных.
- [ ] CSP с per-request nonce (`src/proxy.ts`); `object-src 'none'`, `frame-ancestors 'none'`.
- [ ] HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy` (`next.config.js`).
- [ ] Cookie сессии `HttpOnly`+`Secure`+`SameSite=Lax`.
- [ ] Проверка происхождения мутаций (`Origin`/`Sec-Fetch-Site`) → 403.
- [ ] Секреты только в окружении; `.env` в `.gitignore`.
- [ ] Логи редактируют поля `secret|token|session|ticket|password|credential`.
- [ ] Лимиты длин и rate limit на мутациях/входе/регистрации.
- [ ] `npm audit --omit=dev` без critical/high в production-дереве.
- [ ] Ошибки наружу — без внутренних деталей и SQL.

## Конфигурация окружения (fail-fast)

Валидация выполняется в `src/core/config/env.ts`, а на старте сервера —
через `src/instrumentation.ts` (`register()`), поэтому при неполной конфигурации
процесс не поднимается и не обслуживает запросы. Сообщение об ошибке называет
переменные, но не их значения.

Правила:
- Ни один модуль не читает `process.env` напрямую — только `env` (проверяется ESLint).
