# 04. Аутентификация, права и безопасность

## Модель аутентификации

- OAuth через внешний IdP (Auth.js / NextAuth) + опциональный demo-вход.
- Идентичность привязывается к стабильному `subject` провайдера, не только к email.
  Google-вход ищет аккаунт по `(provider, subject)`; email используется только чтобы
  один раз привязать subject к «легаси»-строке без провайдера. Аккаунт, созданный другим
  провайдером (demo/ticket), по совпадению email не наследуется.
- Канонический origin запинен: приложение выставляет `AUTH_URL` из `APP_ORIGIN`
  (`ensureAuthUrl`), поэтому Auth.js строит callback/redirect из него и не доверяет
  заголовку `Host`. Обратный прокси обязан перезаписывать `Host`/`X-Forwarded-*`.
- demo-вход активен только при `DEMO_LOGIN === '1'` и `NODE_ENV !== 'production'`;
  в production попытка отклоняется, сессия не создаётся. Demo резолвит только
  provisioned-им аккаунты (`provider = 'demo'`, `subject = email`), не имперсонирует
  существующие аккаунты и создаёт новые с ролью `employee` (роль по email не берётся).
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
  | 'thread:read' | 'admin:view' | 'group:view' | 'group:rate'
  | 'group:discuss' | 'group:discuss:create' | 'group:discuss:attach';

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
    // Открытая группа — любому аутентифицированному; закрытая — участнику/админу.
    case 'group:view':
      return resource?.restricted !== true
        || resource?.groupRole === 'admin'
        || resource?.groupRole === 'member';
  }
}
```

Правила:
- Проверка прав — в `service` (источник истины) и, при необходимости, в RSC для UI.
- Никаких проверок ролей внутри `components/ui` и `repository`.
- Каждая ветка `can` покрыта unit-тестом (таблица истинности, 100% ветвей).

### Чтение групп

- `group:view` применяется через `canViewGroup(actor, groupId)` в `modules/groups/service.ts`:
  сервис загружает группу, резолвит роль актора и вызывает `can`. Страницы
  `groups/[id]` и `groups/[id]/admin` вызывают эту функцию один раз и на отказе
  отдают `notFound()` — вкладки (участники, обсуждения, посты, оценки, статистика) не
  загружаются, член-лист не раскрывается.
- `getDiscussion(actor, id, groupId)` в `modules/discussions/service.ts` tenant-aware:
  если обсуждение принадлежит другой группе или актор не имеет доступа к его группе —
  `NOT_FOUND`, посты не отдаются. Один идентификатор из чужой/закрытой группы не утекает.
- Открытые группы по-прежнему читаемы любым аутентифицированным пользователем.

## Валидация границ

- Любой вход (тело, query, params) проходит zod на сервере.
- Схемы переиспользуются в клиентских формах (один контракт).
- Лимиты длин и диапазоны — часть схемы (`createEntryInput`, `listDirectoryInput`).

## Обёртка route и защита мутаций

`core/http/with-route.ts` — единый контракт мутаций: request-id, origin 403,
сессия 401, rate-limit 429, лимит тела 413, zod 400, маппинг `Result` → статус,
непредвиденное → 500 без деталей. Актор передаётся через `resolveActor` (инверсия
зависимости, чтобы `core` не знал о `modules`).

- Лимит тела читается потоково и считается в **байтах**: чтение прерывается сразу
  при превышении `maxBodyBytes`, поэтому chunked-тело без `content-length` не
  обходит ограничение (раннее полное буферизование устранено).
- Путь-параметры (`groupId`, `discussionId`) передаются через `pathParams`, так что
  `withRoute` — единственный читатель тела; маршруты больше не перечитывают его.
- Rate limiting: интерфейс `RateLimiter` с асинхронным `consume`
  (`core/http/rate-limit.ts`). `PostgresRateLimiter` — общий счётчик на существующем
  пуле (один upsert, окно + очистка устаревших строк), `MemoryRateLimiter` — bounded
  реализация для тестов с эвикцией idle-ключей.
- Вход/OAuth-handler (`api/auth/[...nextauth]`) и регистрация (`api/auth/register`)
  ограничены через `rateLimitByIp`, ключ — доверенный IP клиента из
  `X-Forwarded-For`/`X-Real-IP`, которые выставляет прокси.

## Audit-события аутентификации

`modules/auth/audit.ts` пишет структурированные записи о каждом исходе:
`auth.signin.success` и `auth.signin.failed` с `provider` и, где известен, `userId`.
Логгер редактирует поля `secret|session|token|ticket|password|credential`, поэтому в
записях нет учётных данных, токенов, ticket'ов, сессий и паролей.

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
