# 05. Дизайн-система и UI-принципы

## Принципы

1. **Mobile-first**, доступность как требование, а не «потом».
2. **Токены вместо хардкода**: цвета/радиусы/тени — только через CSS-переменные.
3. **shadcn/ui — база**, не плодим кастом там, где хватает готового.
4. **Компонент = представление**, без доступа к данным и правам.
5. **Единые состояния**: loading / empty / error / success для любого асинхронного блока.

## Токены (Tailwind v4, `src/app/globals.css`)

Tailwind 4 конфигурируется CSS-first: `@import 'tailwindcss'`, `@theme inline`
маппит CSS-переменные в утилиты, тёмная тема — вариант по `data-theme`.

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222 47% 11%);
  --primary: hsl(24 95% 53%);
  --destructive: hsl(0 84% 60%);
  --border: hsl(214 32% 91%);
  --radius: 0.75rem;
}

[data-theme='dark'] { /* переопределения */ }

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  --radius-lg: var(--radius);
  /* ... */
}
```

Правила:
- Новая палитра/тема — новый набор переменных + атрибут `data-theme`, без правки компонентов.
- Никаких «магических» hex в JSX.
- Переключатель темы (`components/layout/theme-switcher.tsx`) меняет только `data-theme`.

## Иерархия компонентов

| Уровень | Каталог | Содержимое |
| --- | --- | --- |
| Примитивы | `components/ui/` | button, input, dialog, table (shadcn) |
| Каркас | `components/layout/` | Header, Footer, ThemeSwitcher, Banners |
| Бизнес | `components/features/<feature>/` | формы, таблицы, диалоги фичи |

Правило: компонент `features/*` не обращается к БД и не решает права — он вызывает
мутацию и отображает `Result`.

## Состояния асинхронного блока

```tsx
type ViewState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string; retry?: () => void }
  | { status: 'success'; data: T };
```

Реализация — `components/features/AsyncView.tsx`; используется в `DirectoryList` и
`app/(app)/directory/loading.tsx`.

Обязательно:
- Ошибка не «глотается» (`catch {}` запрещён) — показываем сообщение и retry.
- Empty отличается от Error визуально и по тексту.
- Skeleton для загрузки — не «прыжок» контента.

## Доступность (Definition of Done фичи)

- [ ] Все интерактивные элементы — нативные или с корректной ролью и `tabIndex`.
- [ ] Фокус виден и управляем; модалки трапают фокус (Radix это даёт).
- [ ] Есть `aria-label` у иконочных кнопок и счётчиков.
- [ ] Контраст текста ≥ WCAG AA.
- [ ] Работает с клавиатуры целиком (форма → подтверждение → закрытие).
- [ ] `prefers-reduced-motion` уважается.

## Разделение ответственности на странице

```tsx
// src/app/(app)/directory/page.tsx  (RSC)
import { getActor } from '@/modules/auth/session';
import { listDirectory } from '@/modules/directory';

export default async function DirectoryPage({ searchParams }) {
  const actor = await getActor();
  const params = await searchParams;            // Next 16: searchParams — Promise
  const result = await listDirectory(input);    // чтение на сервере
  return <DirectoryList state={state} />;       // интерактив — отдельным островом
}
```

Правило: «тяжёлые» данные приходят с сервера в пропсах; клиентский компонент не
делает `fetch` при монтировании.
