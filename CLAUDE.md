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

## Community Notifications
- RPC `queue_community_notification` — добавляет офлайн-юзеров в очередь (вызывается в send.post.ts)
- RPC `process_notification_queue` — возвращает и удаляет готовые к отправке записи
- Edge Function `send-community-notifications` — обрабатывает очередь, шлёт в Telegram
- Cron job `process-community-notifications` — вызывает Edge Function каждую минуту
- Telegram Bot может писать только тем, кто взаимодействовал с ботом (WebApp auth это гарантирует)

## Supabase (doka-server)
- Edge Functions path: `/home/vv/supabase/supabase/docker/volumes/functions/`
- Docker compose: `/home/vv/supabase/supabase/docker/docker-compose.yml`
- Env vars: `/home/vv/supabase/supabase/docker/.env`
- Проверить схему: `ssh doka-server "docker exec -i \$(docker ps -q -f name=supabase-db) psql -U postgres -d postgres -c 'SELECT ...'"`
- Проверить RPC: `psql ... -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'function_name'"`
- Проверить cron jobs: `psql ... -c "SELECT * FROM cron.job"`
- После изменения env/compose: `cd /home/vv/supabase/supabase/docker && docker compose up -d functions`
