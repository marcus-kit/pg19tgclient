# CLAUDE.md - TWA Client Portal

This file provides guidance to Claude Code when working with the Telegram Web App portal.

## Project Overview

**PG19 TWA Client** — Telegram Web App версия личного кабинета ПЖ19.

- **Бот:** @PG19WEBAPP_bot
- **URL:** https://pg19-tg.doka.team (prod) / https://dev-pg19-tg.doka.team (dev)
- **Worktree:** `/Users/doka/pg19v2tgclient`
- **Branch:** `tgclient`

**Language**: Russian UI, Russian comments acceptable.

## Nuxt Layer (extends PG19v2)

Этот портал **наследует от PG19v2** (main) через `extends: ['../PG19v2']` в `nuxt.config.ts`.

### Что наследуется от base layer

| Категория | Примеры |
|-----------|---------|
| UI компоненты | `UButton`, `UCard`, `UInput`, `UBadge` |
| Composables | `useSiteContent` |
| Стили | `app/assets/css/main.css` |
| Типы | `types/user.ts` |
| Server utils | `server/utils/supabase.ts` |
| Tailwind config | Brand colors, fonts |
| Nuxt modules | `@nuxt/icon`, `@nuxtjs/color-mode` |

### Portal-specific (НЕ наследуется)

| Категория | Путь |
|-----------|------|
| Страницы | `app/pages/` (dashboard, community, support) |
| Stores | `app/stores/auth.ts` |
| API endpoints | `server/api/` |
| Middleware | `app/middleware/twa-auth.global.ts` |
| Layouts | `app/layouts/twa.vue` |
| TWA компоненты | `app/components/twa/`, `community/` |
| Server utils | `server/utils/userAuth.ts`, `communityNotifier.ts` |

## Ключевые отличия от pg19v2client

| Аспект | pg19v2client (Web) | pg19v2tgclient (TWA) |
|--------|-------------------|---------------------|
| Авторизация | Cookie сессия + Telegram Login Widget | `initData` из WebApp API + Cookie |
| Layout | `default.vue` | `twa.vue` (без хедера) |
| Навигация | AppHeader + MobileNav | TwaMobileNav + BackButton API |
| Cookie | `sameSite: 'strict'` | `sameSite: 'none'` (для webview) |
| Карты | Яндекс Maps | Нет (лёгкий клиент) |

## Commands

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build

# Деплой (из /Users/doka/PG19v2)
./deploy.sh tgclient        # Deploy to production
./deploy.sh tgclient dev    # Deploy to dev
./deploy.sh tgclient --status  # Check status
```

**ВАЖНО для Claude**: При запуске `npm run build` НЕ ограничивай вывод (не используй `| head -100`)

## Directory Structure

```
app/
├── middleware/
│   └── twa-auth.global.ts    # Автоматическая авторизация через initData
├── layouts/
│   └── twa.vue               # TWA layout с BackButton + MobileNav
├── components/
│   ├── twa/                  # TwaMobileNav
│   ├── dashboard/            # BalanceCard, QuickActions, ConnectionCard
│   ├── profile/              # Avatar, ContactInfo
│   └── community/            # Message, MessageList, MessageInput, TypingIndicator
├── composables/
│   ├── useTelegramWebApp.ts  # Telegram WebApp API wrapper
│   ├── useCommunityChat.ts   # Community chat with Realtime (~914 строк)
│   ├── useServices.ts        # Services & subscriptions
│   └── useTickets.ts         # Support tickets
├── plugins/
│   └── telegram-webapp.client.ts  # WebApp.ready(), theme sync, expand
├── stores/
│   └── auth.ts               # Pinia store с localStorage persistence
├── pages/
│   ├── index.vue             # Редирект на /dashboard
│   ├── dashboard.vue         # Главная: баланс, тариф, услуги
│   ├── services.vue          # Подключенные услуги
│   ├── invoices.vue          # Счета на оплату
│   ├── community.vue         # Чат сообщества
│   ├── support/
│   │   ├── index.vue         # Список тикетов
│   │   └── [id].vue          # Детали тикета
│   ├── profile.vue           # Профиль пользователя
│   ├── more.vue              # Меню "Ещё"
│   ├── twa-required.vue      # Ошибка: не в Telegram
│   └── twa-link-account.vue  # Ошибка: аккаунт не привязан
└── types/
    └── community.ts          # Типы для community chat

server/
├── api/
│   ├── auth/
│   │   └── telegram-webapp.post.ts  # Авторизация через initData
│   ├── account/
│   │   └── subscriptions.get.ts     # Подписки пользователя
│   ├── community/
│   │   ├── rooms.get.ts             # Список комнат
│   │   ├── rooms/[id]/join.post.ts  # Вступить в комнату
│   │   ├── rooms/[id]/my-role.get.ts # Роль пользователя
│   │   ├── rooms/mark-read.post.ts  # Отметить прочитанным
│   │   ├── messages.get.ts          # Сообщения (с пагинацией)
│   │   ├── messages/send.post.ts    # Отправить сообщение
│   │   ├── messages/[id]/delete.post.ts
│   │   ├── messages/[id]/pin.post.ts
│   │   ├── messages/[id]/report.post.ts
│   │   └── moderation/              # Модерация
│   ├── support/
│   │   ├── tickets.get.ts
│   │   └── tickets.post.ts
│   ├── services.get.ts
│   └── internal/
│       └── process-notifications.post.ts  # systemd обработчик
└── utils/
    ├── userAuth.ts           # Session management (cookie-based)
    └── communityNotifier.ts  # Telegram batch notifications
```

## Pages

| Страница | Путь | Описание |
|----------|------|----------|
| Дашборд | `/dashboard` | Баланс, тариф, услуги, новости |
| Услуги | `/services` | Подключенные услуги с детализацией |
| Счета | `/invoices` | Счета на оплату, история |
| Сообщество | `/community` | IRC-style чат по адресам |
| Поддержка | `/support` | Список тикетов, создание обращений |
| Детали тикета | `/support/[id]` | Просмотр тикета и переписка |
| Профиль | `/profile` | Данные пользователя, адрес |
| Ещё | `/more` | Дополнительные ссылки |
| TWA Required | `/twa-required` | Ошибка: открыто не в Telegram |
| Link Account | `/twa-link-account` | Ошибка: аккаунт не привязан |

## TWA Authentication

### Authentication Flow

```
1. Пользователь открывает бота @PG19WEBAPP_bot → нажимает Web App
2. Telegram загружает TWA с initData (подписанные данные пользователя)
3. Middleware twa-auth.global.ts:
   - Проверяет authStore.isAuthenticated
   - Проверяет наличие cookie pg19_session
   - Если нет сессии → POST /api/auth/telegram-webapp
4. API валидирует initData через @tma.js/init-data-node
5. Ищет users.telegram_id → создаёт сессию в auth_sessions
6. Устанавливает cookie pg19_session с sameSite: 'none'
7. Middleware сохраняет данные в authStore
```

### Session Cookie Configuration

```typescript
// server/utils/userAuth.ts
setCookie(event, 'pg19_session', token, {
  httpOnly: true,
  secure: true,           // Обязательно для sameSite: 'none'
  sameSite: 'none',       // Работает в Telegram webview
  maxAge: 30 * 24 * 60 * 60,  // 30 дней
  path: '/'
})
```

**Важно**: Cookie ДОЛЖЕН иметь `sameSite: 'none'` и `secure: true` для работы в Telegram webview. Иначе браузер не отправит cookie.

### Server Utils (auto-imported)

```typescript
// server/utils/userAuth.ts
getUserFromSession(event)     // SessionUser | null
requireUser(event)            // SessionUser (throws 401)
createUserSession(event, userId, accountId, method, identifier, metadata)
endUserSession(event)         // Logout
generateSessionToken()        // Crypto-safe 64-char hex
```

### Error Pages

| Страница | Условие | Действие |
|----------|---------|----------|
| `/twa-required` | Не в Telegram или нет initData | Показать инструкцию открыть в боте |
| `/twa-link-account` | telegram_id не найден в users | Показать инструкцию привязать аккаунт |

## Telegram WebApp SDK

### useTelegramWebApp Composable

```typescript
const {
  // State
  isInTelegram,      // readonly<Ref<boolean>>
  isReady,           // readonly<Ref<boolean>>

  // Data
  getInitData,       // () => string | null
  getInitDataUnsafe, // () => TelegramWebAppInitData | null
  getUser,           // () => TelegramWebAppUser | null
  platform,          // 'ios' | 'android' | 'web' | 'unknown'
  version,           // SDK версия
  colorScheme,       // 'dark' | 'light'
  isDark,            // boolean

  // BackButton
  showBackButton,    // (onClick: () => void) => void
  hideBackButton,    // () => void
  offBackButton,     // (onClick: () => void) => void

  // MainButton (синяя кнопка внизу)
  showMainButton,    // (text: string, onClick: () => void) => void
  hideMainButton,    // () => void
  setMainButtonText, // (text: string) => void
  setMainButtonLoading, // (loading: boolean) => void
  enableMainButton,
  disableMainButton,

  // Haptic Feedback
  hapticImpact,      // (style: 'light' | 'medium' | 'heavy') => void
  hapticNotification, // (type: 'success' | 'warning' | 'error') => void
  hapticSelection,   // () => void (для UI элементов)

  // App Control
  closeApp,          // () => void
  expandApp,         // () => void (раскрыть на весь экран)

  // Viewport
  viewportHeight,    // number
  viewportStableHeight, // number
  safeAreaInsets,    // { top, bottom, left, right }
  contentSafeAreaInsets,

  // Theme
  themeParams        // Telegram theme colors
} = useTelegramWebApp()
```

### BackButton Management

В layout `twa.vue` BackButton управляется автоматически:

```vue
<script setup>
const { showBackButton, hideBackButton, offBackButton, hapticImpact } = useTelegramWebApp()

watch(
  () => route.path,
  (path) => {
    // На главной скрываем кнопку назад
    if (path === '/dashboard') {
      hideBackButton()
    } else {
      showBackButton(goBack)
    }
  }
)

const goBack = () => {
  hapticImpact('light')
  router.back()
}

onUnmounted(() => {
  offBackButton(goBack)
})
</script>
```

### Haptic Feedback Usage

```typescript
// При нажатии кнопок
hapticImpact('light')   // Лёгкая вибрация

// При swipe-to-reply
hapticSelection()       // Тактильный отклик выбора

// При успешной отправке
hapticNotification('success')

// При ошибке
hapticNotification('error')
```

## Community Chat

IRC-style чат по географии пользователя (город → район → дом).

### useCommunityChat Composable

```typescript
const {
  // State
  rooms,              // Ref<CommunityRoom[]>
  currentRoom,        // Ref<CommunityRoom | null>
  messages,           // Ref<CommunityMessage[]>
  pinnedMessages,     // Ref<CommunityMessage[]>
  moderators,         // Ref<CommunityModerator[]>

  // Loading states
  isLoadingRooms,     // Ref<boolean>
  isLoadingMessages,  // Ref<boolean>
  isSending,          // Ref<boolean>
  hasMoreMessages,    // Ref<boolean>
  error,              // Ref<string | null>

  // User state
  currentUserRole,    // Ref<CommunityMemberRole>
  isMuted,            // Ref<boolean>
  mutedUntil,         // Ref<string | null>

  // Typing & Presence
  typingUsers,        // Ref<Map<string, { name, timestamp }>>
  onlineUsers,        // Ref<Map<string, PresenceUser>>
  onlineCount,        // ComputedRef<number>

  // Actions
  loadRooms,          // () => Promise<void>
  selectRoom,         // (room: CommunityRoom) => Promise<void>
  loadMore,           // () => Promise<void> (infinite scroll)
  sendMessage,        // (content, options?) => Promise<CommunityMessage | null>
  deleteMessage,      // (messageId) => Promise<void>
  pinMessage,         // (messageId) => Promise<void>
  unpinMessage,       // (messageId) => Promise<void>
  reportMessage,      // (messageId, reason) => Promise<void>
  broadcastTyping,    // () => void

  // Moderation
  muteUser,           // (userId, duration, reason?) => Promise<void>
  unmuteUser,         // (userId) => Promise<void>
  banUser,            // (userId, reason?) => Promise<void>
  unbanUser,          // (userId) => Promise<void>
  setUserRole,        // (userId, role) => Promise<void>

  // Cleanup
  cleanup             // () => Promise<void>
} = useCommunityChat()
```

### Room Hierarchy

Комнаты создаются автоматически по иерархии адреса пользователя:

| Тип | Пример | Участники |
|-----|--------|-----------|
| `city` | Ростов-на-Дону | Все жители города |
| `district` | Советский район | Жители района |
| `building` | ул. Пушкинская, д. 10 | Жители дома |

```typescript
// Сортировка комнат: Город → Район → Дом
rooms.value.sort((a, b) => {
  const order = { city: 0, district: 1, building: 2 }
  return order[a.type] - order[b.type]
})
```

### Realtime Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Realtime                         │
├─────────────────────────────────────────────────────────────┤
│  Channel: community_room_{roomId}                           │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  postgres_changes│  │    broadcast    │  │   presence   │ │
│  │  (new messages) │  │ (typing events) │  │ (online users)│ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬──────┘ │
│           │                    │                    │        │
└───────────┼────────────────────┼────────────────────┼────────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │handleNewMessage│   │handleTyping   │    │syncPresence   │
    │  Дедупликация │   │  Debounce 2s  │    │ State → Map   │
    └───────────────┘    └───────────────┘    └───────────────┘
```

### Message Deduplication

```typescript
// Set для предотвращения дубликатов
const receivedViaBroadcast = new Set<string | number>()
const RECEIVED_VIA_BROADCAST_MAX = 500

// При отправке сообщения добавляем ID в set
receivedViaBroadcast.add(response.message.id)

// При получении через postgres_changes проверяем
if (receivedViaBroadcast.has(payload.new.id)) {
  return // Уже получили через broadcast
}
```

### Typing Indicator

```typescript
// Debounce отправки typing событий
const TYPING_DEBOUNCE = 2000      // Отправляем не чаще 2 сек
const TYPING_TIMEOUT = 3000       // Считаем что перестали печатать через 3 сек
const MAX_TYPING_USERS = 10       // Максимум пользователей в индикаторе

// Компонент TypingIndicator показывает аватары (max 3)
<TypingIndicator :users="typingUsers" />
```

### Optimistic UI

```typescript
// 1. Создаём temp сообщение сразу
const tempId = `temp-${Date.now()}`
const optimisticMessage = {
  id: tempId,
  content: content.trim(),
  status: 'sending',
  // ...
}
messages.value.push(optimisticMessage)

// 2. Отправляем на сервер
const response = await $fetch('/api/community/messages/send', { ... })

// 3. Заменяем temp на реальное
messages.value = messages.value.filter(m => m.id !== tempId)
messages.value.push({ ...response.message, status: 'sent' })

// 4. При ошибке помечаем как failed
messages.value[idx].status = 'failed'
```

## Moderation System

### User Roles

| Роль | Права |
|------|-------|
| `member` | Отправка сообщений, жалобы |
| `moderator` | + Удаление, закрепление, mute, ban |
| `admin` | + Управление ролями, все комнаты |

### Moderation Actions

| Действие | Endpoint | Кто может |
|----------|----------|-----------|
| Mute | `POST /api/community/moderation/mute` | moderator, admin |
| Unmute | `POST /api/community/moderation/unmute` | moderator, admin |
| Ban | `POST /api/community/moderation/ban` | moderator, admin |
| Unban | `POST /api/community/moderation/unban` | moderator, admin |
| Set Role | `POST /api/community/moderation/set-role` | admin only |
| Delete Message | `POST /api/community/messages/[id]/delete` | moderator, admin |
| Pin Message | `POST /api/community/messages/[id]/pin` | moderator, admin |
| Report | `POST /api/community/messages/[id]/report` | all members |

### Mute Duration Limits

```typescript
if (body.duration < 1 || body.duration > 10080) { // max 7 дней
  throw createError({ statusCode: 400, message: 'Длительность от 1 до 10080 минут' })
}
```

### Report Reasons

```typescript
type CommunityReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate'
  | 'misinformation'
  | 'other'
```

## Telegram-style UI Features

| Feature | Описание |
|---------|----------|
| **Swipe-to-reply** | Свайп вправо на сообщении → reply с haptic feedback |
| **Message grouping** | Сообщения одного автора группируются (gap 2px vs 8px) |
| **Glass bubbles** | Полупрозрачные bubble с backdrop-filter blur |
| **Fixed layout** | Header и input зафиксированы, сообщения скроллятся между ними |
| **Scroll-to-quoted** | Клик по quote скроллит к оригиналу с подсветкой |
| **Typing avatars** | Аватары печатающих (max 3) |
| **Time grouping** | Разделители по датам |
| **Read status** | ✓✓ для прочитанных |

### Glass-style Bubbles (Dark Theme)

```css
/* Свои сообщения */
--tg-bubble-own-bg: rgba(135, 116, 225, 0.3);
border-color: rgba(135, 116, 225, 0.3);

/* Чужие сообщения */
--tg-bubble-other-bg: rgba(255, 255, 255, 0.08);
border-color: rgba(255, 255, 255, 0.1);

/* Общий эффект */
backdrop-filter: blur(12px);
```

## Batch Notifications (systemd)

Офлайн-пользователи получают batch-уведомления через @PG19WEBAPP_bot.

### Notification Flow

```
Сообщение отправлено
         │
         └── RPC queue_community_notification
                    │
                    └── UPSERT в community_notification_queue
                              │
                              └── send_at = now() + 1 min (при первом сообщении)

═══════════ Через 1 минуту ═══════════

systemd timer (каждые 30 сек)
         │
         └── POST /api/internal/process-notifications
                    │
                    ├── RPC process_notification_queue (SELECT + DELETE атомарно)
                    │
                    └── Telegram Bot API sendMessage (batch)
                              │
                              └── InlineKeyboard: "Открыть чат" → TWA
```

### Notification Format

**Одно сообщение:**
```
📬 Жители дома 5

Иван Петров:
Привет! Кто знает когда вода будет?

[💬 Открыть чат]
```

**Несколько сообщений (2-3):**
```
📬 Жители дома 5

3 новых сообщения:
• Иван Петров: Привет! Кто зна...
• Мария Сидорова: Вода будет зав...
• Иван Петров: Понял, спасибо!

[💬 Открыть чат]
```

### RPC Functions

| Функция | Описание |
|---------|----------|
| `queue_community_notification(user_id, room_id, message_id, room_name)` | UPSERT с дедупликацией |
| `process_notification_queue()` | Атомарно извлекает готовые записи |
| `cleanup_stale_notifications()` | Удаляет застрявшие (pg_cron каждые 5 мин) |

### systemd Configuration

```bash
# /etc/systemd/system/pg19-notification-processor.timer
[Unit]
Description=PG19 Notification Processor Timer

[Timer]
OnBootSec=30
OnUnitActiveSec=30s

[Install]
WantedBy=timers.target
```

```bash
# /etc/systemd/system/pg19-notification-processor.service
[Unit]
Description=PG19 Notification Processor

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST -H "Authorization: Bearer ${INTERNAL_API_SECRET}" https://pg19-tg.doka.team/api/internal/process-notifications
```

### Server Commands

```bash
sudo systemctl status pg19-notification-processor.timer
sudo systemctl start pg19-notification-processor.timer
sudo journalctl -u pg19-notification-processor.service -f
```

## API Endpoints

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/telegram-webapp` | POST | No | Авторизация через initData |
| `/api/auth/logout` | POST | Yes | Завершить сессию |

### Account

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/account/subscriptions` | GET | Yes | Подписки пользователя |
| `/api/services` | GET | No | Список всех услуг |

### Community

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/community/rooms` | GET | Yes | Комнаты по адресу |
| `/api/community/rooms/[id]/join` | POST | Yes | Вступить в комнату |
| `/api/community/rooms/[id]/my-role` | GET | Yes | Роль пользователя |
| `/api/community/rooms/mark-read` | POST | Yes | Отметить прочитанным |
| `/api/community/messages` | GET | Yes | Сообщения (limit, before, pinned) |
| `/api/community/messages/send` | POST | Yes | Отправить сообщение |
| `/api/community/messages/[id]/delete` | POST | Yes | Удалить (moderator+) |
| `/api/community/messages/[id]/pin` | POST | Yes | Закрепить/открепить |
| `/api/community/messages/[id]/report` | POST | Yes | Пожаловаться |

### Moderation

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/community/moderation/moderators` | GET | Yes | Список модераторов |
| `/api/community/moderation/mute` | POST | Yes | Замутить (1-10080 мин) |
| `/api/community/moderation/unmute` | POST | Yes | Размутить |
| `/api/community/moderation/ban` | POST | Yes | Забанить |
| `/api/community/moderation/unban` | POST | Yes | Разбанить |
| `/api/community/moderation/set-role` | POST | Yes | Изменить роль (admin) |
| `/api/community/moderation/reports` | GET | Yes | Список жалоб |
| `/api/community/moderation/reports/[id]/review` | POST | Yes | Рассмотреть жалобу |

### Support

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/support/tickets` | GET | Yes | Тикеты пользователя |
| `/api/support/tickets` | POST | Yes | Создать тикет |

### Internal (systemd only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/internal/process-notifications` | POST | Secret | Обработка очереди |

## Database Tables

### Session Management

```sql
auth_sessions (
  id UUID PRIMARY KEY,
  session_token VARCHAR(64) UNIQUE,
  method VARCHAR(20),           -- 'telegram' | 'contract'
  identifier VARCHAR(255),      -- telegram_id или contract_number
  verified BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id),
  account_id UUID REFERENCES accounts(id),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB                -- { platform: 'telegram_webapp', ... }
)
```

### Community Tables

```sql
-- Комнаты
community_rooms (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20),             -- 'city' | 'district' | 'building'
  name VARCHAR(255),
  members_count INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  created_at TIMESTAMPTZ
)

-- Участники
community_members (
  id UUID PRIMARY KEY,
  room_id INT REFERENCES community_rooms(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',  -- 'member' | 'moderator' | 'admin'
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ
)

-- Сообщения
community_messages (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES community_rooms(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  content_type VARCHAR(20),     -- 'text' | 'image'
  image_url TEXT,
  image_width INT,
  image_height INT,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  reply_to_id INT REFERENCES community_messages(id),
  created_at TIMESTAMPTZ
)

-- Муты
community_mutes (
  room_id INT,
  user_id UUID,
  muted_by UUID,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (room_id, user_id)
)

-- Баны
community_bans (
  room_id INT,
  user_id UUID,
  banned_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ,
  PRIMARY KEY (room_id, user_id)
)

-- Жалобы
community_reports (
  id UUID PRIMARY KEY,
  message_id INT REFERENCES community_messages(id),
  reporter_id UUID REFERENCES users(id),
  reason VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'reviewed' | 'dismissed'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Очередь уведомлений
community_notification_queue (
  id UUID PRIMARY KEY,
  user_id UUID,
  room_id INT,
  room_name VARCHAR(255),
  message_count INT DEFAULT 1,
  last_messages JSONB,          -- [{id, content, author}]
  send_at TIMESTAMPTZ,          -- now() + 1 min при первом сообщении
  created_at TIMESTAMPTZ
)
```

## Environment Variables

### Build-time (nuxt.config.ts)

```bash
SUPABASE_URL=https://supabase.doka.team
SUPABASE_KEY=<anon_key>
TELEGRAM_BOT_USERNAME=PG19WEBAPP_bot
```

### Runtime (docker-compose)

```bash
NUXT_TELEGRAM_BOT_TOKEN=<bot_token>       # Для валидации initData
NUXT_SUPABASE_SERVICE_KEY=<service_key>
NUXT_INTERNAL_API_SECRET=<random_string>  # Защита /api/internal/*
```

## Multi-Portal Architecture

| Portal | URL | Описание |
|--------|-----|----------|
| `main` | pg19.doka.team | Основной сайт |
| `land` | pg19-land.doka.team | Landing page |
| `partner` | pg19-partner.doka.team | Партнёрский портал |
| `client` | pg19-client.doka.team | Личный кабинет (Web) |
| **`tgclient`** | **pg19-tg.doka.team** | **← Этот портал** |
| `admin` | pg19-admin.doka.team | Админ-панель |

## Known Issues & Solutions

### Cookie не сохраняется в Telegram

**Причина:** `sameSite: 'strict'` блокирует cookie в webview.
**Решение:** Использовать `sameSite: 'none'` + `secure: true` в `userAuth.ts`.

### Middleware не вызывает API при повторном входе

**Причина:** `authStore.isAuthenticated` = true из localStorage, но сессии в БД нет (истекла).
**Решение:** Проверять и store и cookie:
```typescript
if (authStore.isAuthenticated && hasSession) return
```

### Telegram WebApp SDK не загружается

**Причина:** SDK загружается асинхронно.
**Решение:** Middleware ждёт до 3 секунд:
```typescript
const webApp = await waitForTelegramWebApp(3000)
if (!webApp) {
  return navigateTo('/twa-required')
}
```

### Community не загружает комнаты

**Причина:** Пользователь не имеет привязанного адреса.
**Решение:** API возвращает пустой массив `[]`, UI показывает сообщение "Нет доступных комнат".

### Дубликаты сообщений в чате

**Причина:** Получение через broadcast и postgres_changes одновременно.
**Решение:** Set `receivedViaBroadcast` для дедупликации (max 500 записей).

### Навигация на подстраницу не работает (URL меняется, контент нет)

**Причина:** Конфликт структуры маршрутов Nuxt. Если есть `pages/foo.vue` + `pages/foo/bar.vue`, Nuxt интерпретирует `foo.vue` как parent layout для `foo/*`, и без `<NuxtPage />` внутри дочерние роуты не рендерятся.
**Решение:** Использовать `pages/foo/index.vue` + `pages/foo/bar.vue` — они будут независимыми sibling routes.

```
❌ Неправильно:              ✅ Правильно:
pages/                       pages/foo/
├── foo.vue      (parent)    ├── index.vue    (sibling)
└── foo/                     └── bar.vue      (sibling)
    └── bar.vue  (child)
```

### Уведомления не приходят

**Проверить:**
1. Пользователь написал `/start` боту
2. systemd timer активен: `systemctl status pg19-notification-processor.timer`
3. `NUXT_INTERNAL_API_SECRET` совпадает в сервисе и docker-compose
4. Logs: `journalctl -u pg19-notification-processor.service -f`

## Testing

### В Telegram

1. Открыть @PG19WEBAPP_bot в Telegram
2. Написать `/start` для активации уведомлений
3. Нажать кнопку "Открыть" (Web App)
4. Проверить:
   - Dashboard показывает баланс и данные
   - Services показывает подключенные услуги
   - Community показывает комнаты чата
   - Profile показывает адрес подключения

### В браузере (отладка)

```bash
# Локальный dev сервер
npm run dev

# Открыть http://localhost:3000
# Будет показана страница /twa-required

# Для тестирования с mock initData используй Telegram Bot API Test Mode
```

### Debug Page

`/twa-debug` — страница для отладки:
- Показывает initData
- Telegram user info
- Platform, version, colorScheme
- Viewport dimensions
