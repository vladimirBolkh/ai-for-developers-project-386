# calls_calendar

Web-приложение: **Vite + React + TypeScript + Mantine 9** (UI) + **dayjs** (даты, для `@mantine/dates`).

## Команды

```bash
npm install      # установка зависимостей
npm run dev      # dev-сервер Vite
npm test         # прогон тестов (Vitest, однократно)
npm run test:watch # тесты в watch-режиме
npm run build    # type-check (tsc -b) + production-сборка
npm run preview  # предпросмотр production-сборки
```

## Структура

- `index.html` — точка входа, подключает `/src/main.tsx`
- `src/main.tsx` — монтирование приложения + `MantineProvider` (здесь импортируются стили Mantine)
- `src/App.tsx` — корневой компонент
- `vite.config.ts` — плагины, алиас `@ → src`, dev-прокси API, PostCSS Mantine (`css.postcss`: `postcss-preset-mantine` + брейкпоинты), sourcemap и разбивка чанков

## Окружение

Скопируйте `.env.example` в `.env` и укажите адрес бэкенда для dev-прокси:

```
VITE_API_PROXY=http://localhost:8080
```

## Пути

Алиас `@` указывает на `src/`:

```ts
import App from '@/App'
```
