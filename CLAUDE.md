# PG19 Telegram Client

## Stack
- Nuxt 4 (SSR disabled), Pinia, Supabase, @tma.js/sdk-vue
- `vue-router` встроен в Nuxt — не добавлять в dependencies

## Telegram WebApp
- Используй `useTwa()` из `~/composables/useTwa.ts` для доступа к Telegram API
- НЕ существует `useTelegramWebApp()` — это ошибка
- SDK: @tma.js/sdk-vue (официальный Telegram Mini Apps SDK)
- Возвращает: webApp, backButton, haptic, user, isReady
- НЕ использовать vue-tg или @telegram-apps/sdk-vue — deprecated

## Performance
- `useFetch` с `lazy: true` — не блокирует навигацию, показывает skeleton
- Middleware `twa-auth.global.ts` — не делает API если уже авторизован
- KeepAlive включен для основных страниц (кэш в памяти)
- SPA режим (`ssr: false`) — правильный для TWA, SDK клиентский

## Auth Store
- Ручная персистентность через localStorage (ключ: `pg19_lk_auth`)
- Методы: `persist()`, `hydrate()`
- НЕ нужен pinia-plugin-persistedstate

## Команды
- `pnpm run build` — сборка
- `pnpm run dev` — dev server

## Community Chat (useCommunityChat.ts)
- Optimistic UI: temp-сообщение должно содержать ВСЕ данные для отображения (включая `replyTo` объект, не только `replyToId`)
- Broadcast messages: входящие сообщения могут не содержать joined fields — дополнять из локального `messages.value`
- Типы: `CommunityReplyPreview` для цитат, `CommunityMessage` для полных сообщений
