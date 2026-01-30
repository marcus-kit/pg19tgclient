# PG19 Telegram Client

Telegram Mini App клиент ЛК ПЖ19. Nuxt 4 (SSR disabled) + Pinia + Supabase + @telegram-apps/sdk v3.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |

**Deploy:** только `git push` — `pnpm build` локально не запускать.

## Architecture

```
app/
  components/     # UI components
  composables/
    useTwa.ts     # Telegram WebApp API wrapper
    useCommunityChat.ts  # Community chat logic
  stores/         # Pinia stores (manual localStorage persist)
  pages/          # SPA pages
server/
  api/            # API endpoints
```

## Key Files

- `composables/useTwa.ts` — **Единственный** способ доступа к Telegram API (НЕ useTelegramWebApp!)
- `middleware/twa-auth.global.ts` — Auth middleware (skip if already authenticated)
- `stores/auth.ts` — Manual persist via localStorage (`pg19_lk_auth`)

## Telegram WebApp

- SDK: `@telegram-apps/sdk` v3.x (official)
- `useTwa()` returns: webApp, backButton, haptic, qrScanner, user, isReady
- **НЕ использовать:** vue-tg, @tma.js/sdk-vue (устаревшие)
- SPA режим (`ssr: false`) — правильно для TWA, SDK клиентский

## Auth Store

- Ручная персистентность через localStorage (ключ: `pg19_lk_auth`)
- Методы: `persist()`, `hydrate()`
- **НЕ нужен** pinia-plugin-persistedstate

## Community Chat

- Optimistic UI: temp-сообщение должно содержать ВСЕ данные (включая `replyTo` объект)
- Broadcast messages могут не содержать joined fields — дополнять из локального `messages.value`
- Типы: `CommunityReplyPreview` для цитат, `CommunityMessage` для полных

## Community Notifications

- RPC `queue_community_notification` — добавляет офлайн-юзеров в очередь
- RPC `process_notification_queue` — возвращает и удаляет готовые записи
- Edge Function `send-community-notifications` — обрабатывает очередь (cron каждую минуту)
- Telegram Bot может писать только тем, кто взаимодействовал с ботом

## Performance

- `useFetch` с `lazy: true` — не блокирует навигацию, показывает skeleton
- Middleware `twa-auth.global.ts` — не делает API если уже авторизован
- KeepAlive включен для основных страниц (кэш в памяти)

## Интеграция с billing

### Источник данных

Биллинговые данные хранятся в схеме `billing` и читаются через PostgreSQL Views в схеме `public`.

**ВАЖНО:** НЕ использовать таблицы напрямую! Старые таблицы переименованы в *_backup.

### Views (public схема)

| View | Назначение |
|------|------------|
| contracts_view | Договоры с адресами |
| invoices_view | Счета |
| services_view | Услуги |
| subscriptions_view | Подписки |

### Паттерн использования

```typescript
// ПРАВИЛЬНО
const { data } = await supabase
  .from('invoices_view')
  .select('*')
  .eq('user_id', authStore.user.id)

// НЕПРАВИЛЬНО
.from('accounts')  // ❌ Таблица переименована!
```

### Связь Telegram user ↔ billing customer

1. Telegram авторизация создаёт запись в `public.users`
2. `user_customer_links` автоматически связывает по phone/email
3. Views возвращают данные только для связанных customers

### URL billing системы

- Админка: https://billing.doka.team
