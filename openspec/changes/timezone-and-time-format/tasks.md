## 1. Предпочтения и форматтер

- [x] 1.1 Добавить в `src/components/layout/preferences.ts` ключи `timezone` и `hour-cycle` (дефолт: пусто = браузерная зона, `24`) и хук `useTimeFormat() -> { timeZone, hour12, setTimeZone, setHourCycle }` с синхронизацией через `storage`/`PREFERENCES_EVENT`; unit-тест `tests/unit/preferences.test.ts` — запись, чтение, дефолты, событие.
- [x] 1.2 Реализовать утилиту `formatTimestamp(iso, { timeZone, hour12 })` (через `Intl.DateTimeFormat` + `formatToParts`, вид `14:07 11.10.26` для 24 ч и эквивалент 12 ч) и резолвер эффективной зоны с `try/catch`-fallback на `Intl.DateTimeFormat().resolvedOptions().timeZone`; unit-тест `tests/unit/format-timestamp.test.ts` — 24/12 ч, заданная зона смещает время, невалидная зона откатывается, формат разделителей стабилен.
- [x] 1.3 Создать клиентский `src/components/ui/timestamp.tsx` (`<time dateTime={iso}>` с текстом только после монтирования); unit-тест — до монтирования текста нет, после — формат корректен, смена предпочтения в зоне обновляет вывод.

## 2. Применение единого формата

- [x] 2.1 Заменить `post.createdAt.slice(0, 10)` под комментарием на `Timestamp` в `GroupDiscussions.tsx`; unit-тест показывает время в выбранной зоне.
- [x] 2.2 Заменить `event.createdAt.slice(0, 10)` на `Timestamp` в `GroupActivity.tsx`; unit-тест.
- [x] 2.3 Перевести показ момента в ленте (`SocialFeed.tsx`/`feed.ts`) на `Timestamp` (источник — `createdAt` события), не меняя источник данных; unit-тест.
- [x] 2.4 Проверить, что даты «только дата» не затронуты: `watchedAt` в `MyFilmsView.tsx`, `MySeriesView.tsx`, `ProfileView.tsx`, `RecordView.tsx` остаются датами без сдвига; unit-ревью/тест.

## 3. Настройки

- [x] 3.1 Добавить в `SettingsView.tsx` секцию «Время»: `TimezoneSelect` (опция «Как в браузере» + `Intl.supportedValuesOf('timeZone')` с fallback-списком) и `HourCycleSelect` (24/12), связанные с `useTimeFormat` и применяющиеся немедленно; unit-тест `tests/unit/screens.test.tsx` — контролы отражают и меняют выбор.

## 4. Финальная проверка

- [x] 4.1 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration` проходят; e2e: смена тайм-зоны/формата часов меняет время комментария, существующие e2e не регрессируют.
