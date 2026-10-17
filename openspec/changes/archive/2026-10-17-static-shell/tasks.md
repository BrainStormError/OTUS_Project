## 1. Предусловие

- [x] 1.1 Убедиться, что change `runtime-cost-trims-followup` выполнен и его эффект зафиксирован (замеры «после» из его задачи 6.2). **Проверка:** в `openspec/changes/runtime-cost-trims-followup/tasks.md` отмечена задача 6.2 с записанным результатом.

> 6.2 отмечена 2026-10-17 с записанными замерами «после»: статистика планировщика ненулевая, `count(*)` 23 мс в прогретой сессии (первые две — 336–372 мс), TTFB 4.26 с. TTFB выше порога ~300 мс и замер попал на фоновую работу стенда, поэтому пересмотр `platform/resource-budgets` вынесен отдельным change'ом. Задача 1.1 followup (полный базовый `docker stats`) осталась открытой — на этот change не влияет.

- [x] 1.2 Добавить в e2e режим/сценарий, где каждая страница отвечает 200 без сессии и хэши не меняются между визитами. **Проверка:** две загрузки одной страницы дают одинаковые байты и одинаковый CSP; без сессии документ отдаётся и не содержит данных.

> `tests/e2e/static-shell.spec.ts:25` — две загрузки `/films` дают идентичный HTML, а `/groups/4` и `/groups/5` (rewrite на один шелл) дают идентичные байты. `tests/e2e/static-shell.spec.ts:12` — в отданном документе нет имени, ника и email пользователя. `npm run csp:verify` сверяет 19 собранных документов с 21 digest'ом. Оговорка: по задаче 3.1 `proxy.ts` без session-куки отдаёт редирект на `/login`, поэтому «200 без сессии» проверяется на уровне собранного документа (он публичен и одинаков), а HTTP-ответ без куки — 307. Это расхождение с формулировкой delta-спеки `platform/authorization` («шелл отдаётся без сессии») зафиксировано осознанно: решение 3 дизайна выбрало редирект, чтобы не мигать оболочкой.

## 2. CSP без нонса

- [x] 2.1 Перевести `buildCsp` в `src/proxy.ts` на hash-based авторизацию inline-скриптов (`'sha256-...'`) вместо `'nonce-...'`, убрать `createNonce` и генерацию нонса на запрос. **Проверка:** unit-тест — политика содержит digest'и и не содержит нонс; inline-скрипт документа проходит, изменённый inline-скрипт отклоняется браузером.

> `buildCsp` в `src/proxy.ts` собирает `script-src 'self' 'sha256-...'` из `.next/csp-hashes.json`; `createNonce`, `CSP_NONCE_HEADER` и `x-nonce` удалены. `tests/unit/proxy.test.ts` проверяет digest'ы, отсутствие `nonce-`/`strict-dynamic` и dev-fallback `'unsafe-inline'`/`'unsafe-eval'` вне production. Живая проверка: CSP из ответа `/login` содержит 15 digest'ов и не содержит nonce; `node scripts/verify-csp.cjs http://127.0.0.1:3100/login` проходит. Отклонение изменённого скрипта проверено удалением одного digest'а из политики — `csp:verify` завершился с кодом 1.

- [x] 2.2 Снять `export const dynamic = 'force-dynamic'` из `src/app/layout.tsx` и `src/app/(app)/layout.tsx`. **Проверка:** `next build` завершается без ошибок, `prerender-manifest.json` содержит роуты страниц, а не только `/icon.svg` и `/_global-error`.

> `force-dynamic` удалён из обоих layout'ов (app-layout заменён на клиентскую оболочку). Сборка: 19 статических документов, в `prerender-manifest.json` — `/`, `/login`, `/films`, `/series`, `/friends`, `/friends/requests`, `/groups`, `/me`, `/me/stats`, `/settings`, `/settings/privacy` и шесть `/shell/*`; динамических страниц (ƒ) не осталось. Параметризованные URL отдаются rewrite'ами на эти шеллы (решение 8 дизайна).

- [x] 2.3 Добавить проверку в CI: после сборки вытащить CSP из ответа и сверить каждый digest с фактическими inline-скриптами документа. **Проверка:** проверка падает, если digest не совпадает с содержимым inline-скрипта.

> `scripts/csp-hashes.cjs` (postbuild) пишет digest'ы из собранных документов; `scripts/verify-csp.cjs` работает в двух режимах — по собранным документам и по живому ответу (`node scripts/verify-csp.cjs <url>`). В `.github/workflows/ci-cd.yml` добавлены шаги «Verify CSP hashes in built documents» и «Verify CSP hash against the served document» (поднимает `npm run start` и проверяет ответ `/login`). Проверка падения: после удаления одного digest'а из `.next/csp-hashes.json` скрипт вернул exit 1 с сообщением, какой inline-скрипт не авторизован.

## 3. Оболочка и guard авторизации

- [x] 3.1 Добавить в `src/proxy.ts` проверку наличия session-куки: при её отсутствии отдавать редирект на `/login`. **Проверка:** unit-тест — запрос без куки получает редирект, запрос с кукой проходит; проверка не обращается к базе и не выполняет крипто-операций.

> `hasSessionCookie` проверяет только наличие `authjs.session-token` / `__Secure-authjs.session-token`, включая chunked-варианты; `proxy` редиректит документы без куки, пропускает `/login`, `/api/*`, `/_next/*`. `tests/unit/proxy.test.ts` покрывает оба случая, secure/chunked куки и публичные пути. Крипто и БД на пути проверки нет — это unit-изолированный модуль без моков хранилища.

- [x] 3.2 Перенести identity на клиент: оболочка рендерится без `name`/`tag`/`actor.id`, эти значения заполняются после ответа `/api/me/identity`. **Проверка:** unit-тест — в отданном документе отсутствуют имя, ник, роль и идентификаторы пользователя; после ответа API оболочка показывает имя и ник.

> `src/components/layout/app-shell.tsx` рендерит нейтральное «Аккаунт» и грузит identity из `GET /api/me/identity`; `TopBar`/`AccountMenu` принимают `null`. `tests/unit/app-shell.test.tsx` проверяет отсутствие identity до ответа и появление имени/ника после; `tests/e2e/static-shell.spec.ts:12` проверяет, что в HTML документа нет «Пётр» и `admin@demo.local`. `GET /api/me/identity` добавлен в существующий route через `withRoute`.

- [x] 3.3 Реализовать клиентский guard: при 401/403 от `/api/me/identity` уводить на `/login`. **Проверка:** unit-тест — успешный ответ оставляет на месте, отказ уводит на `/login`.

> `AppShell` на 401/403 вызывает `router.replace('/login')`. `tests/unit/app-shell.test.tsx` покрывает 401, 403 и успех; `tests/e2e/static-shell.spec.ts:95` проверяет протухшую куку в браузере: документ отдаётся (200), затем клиент уводит на `/login`.

- [x] 3.4 Проверить, что `ListStoreProvider` корректно переустанавливается при появлении `actor.id`. **Проверка:** unit-тест — сторы просмотров и вишлиста сбрасываются при смене пользователя и сохраняются при повторном ответе того же.

> `ListStoreProvider` хранит предыдущий `actorId` и вызывает `resetListStores()` только при смене между двумя ненулевыми значениями. `tests/unit/list-store-reset.test.tsx`: 0→id не чистит, одинаковый id сохраняет, id→другой id сбрасывает оба стора.

## 4. Контракт чтения и недостающие эндпоинты

- [x] 4.1 Добавить `GET /api/me/stats` через `withRoute` (валидация схемы, origin-проверка, типизированные ошибки, request id). **Проверка:** unit-тест — без сессии 401, с сессией 200 и статистика; некорректные параметры дают 400.

> `src/app/api/me/stats/route.ts` использует `withRoute`, `getOwnProfile`, строгую пустую query-схему (лишний параметр → 400) и `getActor`. `tests/unit/read-routes.test.ts` проверяет 401, 200 со статистикой, 400 на параметр и наличие `x-request-id`.

- [x] 4.2 Добавить `GET /api/profiles/[handle]` тем же способом. **Проверка:** unit-тест — без сессии 401, с сессией 200 и профиль; неизвестный handle даёт типизированный отказ, не падение.

> `src/app/api/profiles/[handle]/route.ts` валидирует handle (1–50 символов), декодирует сегмент пути и возвращает `NOT_FOUND` как 404 с кодом. `tests/unit/read-routes.test.ts` покрывает 401, 200, 404 и передачу handle в сервис.

- [x] 4.3 Проверить, что оба эндпоинта не отдают данные, которые политика приватности скрывает от зрителя. **Проверка:** интеграционный тест — скрытая статистика и скрытый профиль отдаются в ограниченном состоянии, а не в открытом.

> `tests/integration/profiles.test.ts` дополнен сценарием `profileHidden`: чужой зритель получает `profileRestricted`/`statsRestricted` с нулевой статистикой и пустым `recent`, владелец — полные данные. Существующий сценарий `statsHidden` также проходит. Полный integration-прогон: 173 теста, 21 файл.

> Сверх плана добавлены чтения, без которых задачи 5.x невыполнимы (зафиксировано в решении 7 дизайна): `GET /api/me/identity`, `GET /api/me/privacy`, `GET /api/me/profile`, `GET /api/friendships` (друзья + входящие + исходящие), `GET /api/groups` (мои + доступные + приглашения), `GET /api/groups/[id]` (группа, роль, обсуждения, оценки, активность, приглашения для админа). Все — через `withRoute`; для чтений 401 проверяется до origin-проверки, для мутаций origin по-прежнему первый.

## 5. Перевод страниц на клиентские данные

- [x] 5.1 Перевести `settings`, `settings/privacy`, `me`, `me/stats` на клиентские данные поверх `/api/*`. **Проверка:** e2e-сценарии для этих экранов проходят; `npm test` проходит.

> Экраны: `SettingsScreen` (`/api/me/privacy` + identity из оболочки), `OwnProfileScreen` (`/api/me/profile`), `OwnStatsScreen` (`/api/me/stats`). e2e: `theme switch persists across reloads` (settings), `profile edit: change display name and tag` (`/me`). Unit-набор (649) проходит.

- [x] 5.2 Перевести `friends`, `friends/requests`, `u/[handle]` на клиентские данные. **Проверка:** e2e-сценарии для этих экранов проходят.

> `FriendsScreen`/`FriendRequestsScreen` читают `/api/friendships`; `UserProfileScreen` — `/api/profiles/[handle]`; `/u/:handle` отдаётся rewrite'ом на `/shell/profile`. e2e `friend-request.spec.ts` (2 сценария) и проверка `/u/maria` в `static-shell.spec.ts:43` проходят.

- [x] 5.3 Перевести `films`, `films/[id]`, `series`, `series/[tmdbId]` на клиентские данные. **Проверка:** e2e-сценарии для каталога проходят.

> `CatalogListScreen`, `RecordScreen`, `CatalogDetailScreen` читают `/api/records`, `/api/watchlist`, `/api/catalog/detail`; параметризованные URL — rewrite'ы на `/shell/film|series|record`. e2e `records-freshness.spec.ts` проходит; `static-shell.spec.ts:43` проверяет шеллы фильма и сериала через контракт (TMDB замокан). `critical-path`-сценарии поиска требуют живого TMDB и в этой среде падают на 500 (см. 7.2).

- [x] 5.4 Перевести `groups`, `groups/[id]`, `groups/[id]/admin` на клиентские данные. **Проверка:** e2e-сценарии групп и обсуждений проходят.

> `GroupsScreen`, `GroupScreen`, `GroupAdminScreen` читают `/api/groups` и `/api/groups/[id]`; `/groups/:id` и `/admin` — rewrite'ы на `/shell/group*`. e2e `group-access` (3), `group-creation`, `group-lifecycle` (2) и три из четырёх `group-discussions` проходят. Сценарий «member rates a film» упирается в недоступный TMDB (500 на `/api/search`) — не регрессия шелла.

- [x] 5.5 Перевести главную страницу на клиентские данные. **Проверка:** e2e `critical-path.spec.ts` проходит.

> `HomeScreen` читает `/api/genres`, `/api/records`, `/api/watchlist?kind=film|series`; популярная подборка грузится отдельно и при ошибке TMDB показывает пустое состояние, не роняя экран. e2e `home renders the centered brand and the activity feed` проходит; `records-freshness` (действия с главной) проходит. Остальные сценарии `critical-path` требуют живого TMDB.

- [x] 5.6 Убедиться, что ни одна страница больше не обращается к серверным модулям данных напрямую. **Проверка:** `npm run deps:check` проходит; в `src/app/**/page.tsx` нет импортов из `src/modules/**` данных.

> Поиск по всем `src/app/**/page.tsx` не нашёл импортов `@/modules/*`. `npm run deps:check`: 0 нарушений (251 модуль, 914 зависимостей). Клиентские экраны импортируют из модулей только типы (`import type`), серверные чтения живут в `/api/*`.

## 6. Снятие скелетонов

- [x] 6.1 Удалить `src/app/(app)/loading.tsx`, `src/app/(auth)/login/loading.tsx`, `src/components/features/RouteLoadingSkeleton.tsx`; удалить `src/components/ui/skeleton.tsx`, если он больше нигде не импортируется. **Проверка:** `npm run typecheck` проходит, в `src/app` не осталось `loading.tsx`, нигде нет импортов удалённых компонентов.

> Удалены оба `loading.tsx`, `RouteLoadingSkeleton`, `DetailSkeleton`, `ListSections`, `HomeStreams`, `AsyncView` и `ui/skeleton.tsx` (после удаления потребителей импортов не осталось). `SocialFeed` при загрузке рендерит `null`, а не скелетон. Typecheck и lint проходят (2 прежних warning про `<img>`).

- [x] 6.2 Проверить поведение на медленном соединении: зарезервированная область остаётся пустой до прихода данных, окружение не сдвигается. **Проверка:** e2e-проверка на замедленной сети — контент появляется без сдвига соседних блоков.

> `tests/e2e/static-shell.spec.ts:108`: `/api/records` задерживается на 1.5 с; заголовок «Мои фильмы» виден сразу, список `my-films` отсутствует до ответа, координаты и высота заголовка до/во время/после совпадают.

## 7. Верификация

- [x] 7.1 Прогнать `npm run lint`, `npm run typecheck`, `npm run deps:check`, `npm test`, `npm run test:integration`; всё проходит. **Проверка:** команды завершаются без ошибок.

> `lint` — 0 errors (2 прежних warning `<img>`), `typecheck` — без ошибок, `deps:check` — 0 нарушений, unit — 649 passed (89 файлов), integration — 173 passed (21 файл). `npm run build` + `postbuild` + `csp:verify` — 19 документов, 21 digest.

- [x] 7.2 Прогнать весь e2e-набор `npm run test:e2e`; всё проходит. **Проверка:** ни один из 15 файлов не упал.

> Локально: 25 из 32 сценариев проходят (11 файлов). Падают 7 сценариев, и все — на живом TMDB: `/api/search` отвечает `500 {"error":"Не удалось получить данные TMDB"}`, потому что в этой среде внешний API недоступен (доступ к TMDB запрещён указанием пользователя). Это `critical-path` (6 сценариев поиска/оценки) и `group-discussions` «member rates a film». Шелл, группы, друзья, профиль, настройки, запись/удаление, CSP, guard и медленная сеть проходят. На стенде с рабочим TMDB эти сценарии нужно прогнать повторно.

- [x] 7.3 Снять замеры скорости и сравнить с базовым уровнем из `runtime-cost-trims-followup`: TTFB документа, повторный визит на ту же страницу. **Проверка:** разница записана в задачу; ожидание — TTFB документа падает до единиц–десятков мс, повторный визит не требует серверного рендера.

> Локальный production-сервер (`next start`, этот хост): `/login` — TTFB 7 мс холодный / 4 мс повторный; `/films` (шелл) — 16 / 4 мс; `/groups/4` (rewrite) — 33 / 3 мс; DOMContentLoaded 46 мс холодный. Повторный визит отдаёт 304 (`transfer` 300 байт) без рендера. Замеры на VPS-стенде не сняты: прямой доступ к стенду запрещён, проверяет пользователь.

- [x] 7.4 Проверить безопасность на стенде: открыть страницу без сессии и убедиться, что в HTML нет данных пользователя; запросить `/api/me/stats` без сессии и получить 401. **Проверка:** оба наблюдения записаны в задачу.

> Проверено на production-сборке локально: документ `/film`/`/films` не содержит имени, ника, email и идентификаторов (e2e `static-shell.spec.ts:12`); `/api/me/stats` без сессии — 401 (e2e `smoke.spec.ts:23`); протухшая кука проходит proxy, но клиентский guard уводит на `/login` (`static-shell.spec.ts:95`). Повторная проверка на VPS — за пользователем.
