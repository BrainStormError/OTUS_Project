## 1. Прекратить события комментариев

- [x] 1.1 Убрать `recordEvent({ kind: 'comment_created' })` из `addComment` в `src/modules/discussions/service.ts`; переписать тест «records a comment_created event» в `tests/integration/discussions.test.ts` на проверку отсутствия события; `npm run test:integration` зелёный.
- [x] 1.2 Исключить уже записанные события комментариев из чтения: завести константу кода рядом с `KIND_CODE` в `src/modules/activity/repository.ts`, добавить фильтр `e.kind <> <code>` в `listFeedEvents` и `listGroupFeedEvents`, возвращать `null` из `findVisibleEvent` для вида комментария; обновить `tests/integration/group-feed.test.ts` (убрать ожидание `comment_created`) и добавить сценарий «событие-комментарий не отдаётся»; `npm run test:integration` зелёный.
- [x] 1.3 Проверить, что живой стрим не пушит комментарии: тест unit/integration на `getVisibleEvent` для события-комментария возвращает `null`; `npm run test:integration` зелёный.

## 2. Ленты: только начало обсуждений

- [x] 2.1 Убрать ветку `comment_created` из `toFeedEvent` (`src/components/features/movie-tracker/feed.ts`) и из `actionLabel` (`GroupActivity.tsx`, строка 19); `npm run typecheck` и unit `feed`, `group-tabs`, `screens`, `social-feed` зелёные.

## 3. Модалки добавления без списка каталога

- [x] 3.1 `MyFilmsView.AddRecordForm`: показывать список только после «Найти» (`visible = committed ? matches : []`) и исключать фильмы, уже присутствующие в `records` (по `movie.tmdbId`); обновить unit `screens` — нет списка до «Найти», уже добавленный фильм не предлагается; `npm run test` зелёный.
- [x] 3.2 `MySeriesView.AddSeriesForm`: то же для сериалов (`visible = committed ? matches : []`, исключение по `series.id`); unit `screens` зелёный.
- [x] 3.3 `GroupRatings` пикер: показывать список только после «Найти» (`visible = committed ? matches : []`), без исключения уже оценённых; обновить unit `group-tabs` и e2e `group-discussions` — перед выбором медиа активировать «Найти»; `npm run test` и `npm run test:e2e` зелёные.

## 4. Финальная проверка

- [x] 4.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят; e2e `critical-path` и `group-discussions` не регрессируют.
