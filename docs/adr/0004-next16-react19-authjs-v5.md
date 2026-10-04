# ADR 0004. Апгрейд до Next.js 16 / React 19 / Auth.js v5

## Статус

Принято (по решению заказчика).

## Контекст

Изначально фундамент был собран на Next.js 14 / React 18 / next-auth v4. Блокирующий
гейт `npm audit --audit-level=high` не проходил: база advisories помечает **все** версии
Next.js < 16.3.8 как critical (RCE на Windows-хостинге, SSRF, cache poisoning, XSS при
CSP-nonce и др.), и пропатченного релиза ветки 14 не существует. Единственный чистый
релиз — `next@16.3.8`.

## Решение

Поднять стек до Next.js 16.3.8 + React 19.3.0 и аутентификацию до Auth.js v5
(`next-auth@5.0.0-beta.32`, официально поддерживает Next 16 / React 19). Сопутствующие
изменения:

- Tailwind 3 → 4 (CSS-first, убирает уязвимую цепочку `braces` в UI-сборке).
- ESLint 8 + `.eslintrc` → ESLint 9 + flat config (`eslint.config.mjs`); `next lint` удалён,
  линт запускается через `eslint .`.
- `middleware.ts` → `src/proxy.ts` (конвенция Next 16), экспорт `proxy`.
- `searchParams` в RSC стали асинхронными (`await searchParams`).
- Тестовые инструменты: Vitest 5, Testing Library 16.3, Playwright 1.63, Vite 7.
- React `cache` доступен из коробки (пер-запросное кэширование `getActor`).

## Альтернативы

- **Остаться на Next 14 и ослабить гейт** — отклонено: critical-уязвимости в рантайме.

## Последствия

- Все гейты зелёные: typecheck, lint, deps:check, 64 unit, 15 integration, 3 e2e, build,
  `npm audit --omit=dev --audit-level=high` → 0 уязвимостей.
- Требуется Node.js >= 20.9 (используем 22/24).
- Версии зафиксированы точно в `package.json` и в `GUIDE.md`.
