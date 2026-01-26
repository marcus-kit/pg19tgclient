# PG19 Telegram Client

## Stack
- Nuxt 4 (SSR disabled), Pinia, Supabase, @tma.js/sdk-vue
- `vue-router` встроен в Nuxt — не добавлять в dependencies

## Telegram WebApp
- Используй `useTwa()` из `~/composables/useTwa.ts` для доступа к Telegram API
- НЕ существует `useTelegramWebApp()` — это ошибка
- SDK: @tma.js/sdk-vue (официальный Telegram Mini Apps SDK)
- Возвращает: webApp, backButton, haptic, user, isReady

## Auth Store
- Ручная персистентность через localStorage (ключ: `pg19_lk_auth`)
- Методы: `persist()`, `hydrate()`
- НЕ нужен pinia-plugin-persistedstate

## Команды
- `pnpm run build` — сборка
- `pnpm run dev` — dev server
