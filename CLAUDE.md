# CLAUDE.md - TWA Client Portal

This file provides guidance to Claude Code when working with the Telegram Web App portal.

## Project Overview

**PG19 TWA Client** — Telegram Web App версия личного кабинета ПЖ19.

- **Бот:** @PG19WEBAPP_bot
- **URL:** https://pg19-tg.doka.team
- **Worktree:** `/Users/doka/PG19v2tgclient`
- **Branch:** `tgclient`

**Language**: Russian UI, Russian comments acceptable.

## Ключевые отличия от pg19v2client

| Аспект | pg19v2client (Web) | pg19v2tgclient (TWA) |
|--------|-------------------|---------------------|
| Авторизация | Cookie сессия + Telegram Login Widget | `initData` из WebApp API + Cookie |
| Layout | `default.vue` | `twa.vue` |
| Навигация | AppHeader + MobileNav | TwaHeader + TwaMobileNav + BackButton API |
| Cookie | `sameSite: 'strict'` | `sameSite: 'none'` (для webview) |

## TWA Authentication Flow

```
1. Пользователь открывает бота → нажимает Web App
2. Telegram загружает TWA с initData
3. Middleware twa-auth.global.ts:
   - Проверяет authStore.isAuthenticated
   - Проверяет наличие cookie pg19_session
   - Если нет сессии → POST /api/auth/telegram-webapp
4. API валидирует initData через @tma.js/init-data-node
5. Создаёт сессию в auth_sessions + устанавливает cookie
6. Middleware сохраняет данные в authStore
```

**Важно:** Cookie должен иметь `sameSite: 'none'` и `secure: true` для работы в Telegram webview.

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build

# Deploy (из /Users/doka/PG19v2)
./deploy.sh tgclient        # Deploy to production
./deploy.sh tgclient --status  # Check status
```

## Directory Structure

```
app/
├── middleware/
│   └── twa-auth.global.ts   # Автоматическая авторизация через initData
├── layouts/
│   └── twa.vue              # TWA layout с BackButton
├── components/
│   ├── twa/                 # TwaHeader, TwaMobileNav
│   ├── dashboard/           # BalanceCard, QuickActions, etc.
│   ├── profile/             # Avatar, ContactInfo, etc.
│   └── community/           # Message, MessageInput, etc.
├── composables/
│   ├── useTelegramWebApp.ts # Telegram WebApp API wrapper
│   ├── useCommunityChat.ts  # Community chat with Realtime
│   ├── useServices.ts       # Services & subscriptions
│   └── useTickets.ts        # Support tickets
├── pages/
│   ├── dashboard.vue        # Главная страница
│   ├── services.vue         # Услуги
│   ├── invoices.vue         # Счета
│   ├── community.vue        # Чат сообщества
│   ├── support.vue          # Поддержка
│   ├── profile.vue          # Профиль
│   ├── more.vue             # Меню "Ещё"
│   ├── twa-required.vue     # Ошибка: не в Telegram
│   └── twa-link-account.vue # Ошибка: аккаунт не привязан
├── plugins/
│   └── telegram-webapp.client.ts  # WebApp.ready(), theme sync
└── stores/
    └── auth.ts              # Pinia store с localStorage persistence

server/
├── api/
│   ├── auth/
│   │   └── telegram-webapp.post.ts  # Авторизация через initData
│   ├── account/
│   │   └── subscriptions.get.ts     # Подписки пользователя
│   ├── community/                   # Community chat API
│   ├── support/                     # Tickets API
│   └── services.get.ts              # Список услуг
└── utils/
    └── userAuth.ts          # Session management (createUserSession, getUserFromSession)
```

## Key Files

### Authentication
- `server/api/auth/telegram-webapp.post.ts` — Валидация initData, создание сессии
- `server/utils/userAuth.ts` — Cookie сессии (`pg19_session`)
- `app/middleware/twa-auth.global.ts` — Автоматическая авторизация

### Telegram WebApp Integration
- `app/plugins/telegram-webapp.client.ts` — Инициализация SDK
- `app/composables/useTelegramWebApp.ts` — BackButton, MainButton, HapticFeedback
- `app/layouts/twa.vue` — Layout с управлением BackButton

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/auth/telegram-webapp` | No | Авторизация через initData |
| `GET /api/services` | No | Список всех услуг |
| `GET /api/account/subscriptions` | Yes | Подписки пользователя |
| `GET /api/community/rooms` | Yes | Комнаты чата по адресу |
| `GET /api/community/messages` | Yes | Сообщения в комнате |
| `POST /api/community/messages/send` | Yes | Отправить сообщение |
| `GET /api/support/tickets` | Yes | Тикеты пользователя |
| `POST /api/support/tickets` | Yes | Создать тикет |

## Environment Variables

**Build-time (nuxt.config.ts):**
- `SUPABASE_URL` — https://supabase.doka.team
- `SUPABASE_KEY` — Anon key
- `TELEGRAM_BOT_USERNAME` — PG19WEBAPP_bot

**Runtime (docker-compose):**
- `NUXT_TELEGRAM_BOT_TOKEN` — Токен бота для валидации initData
- `NUXT_SUPABASE_SERVICE_KEY` — Service role key

## Known Issues & Solutions

### Cookie не сохраняется в Telegram
**Причина:** `sameSite: 'strict'` блокирует cookie в webview.
**Решение:** Использовать `sameSite: 'none'` + `secure: true` в `userAuth.ts`.

### Middleware не вызывает API
**Причина:** `authStore.isAuthenticated` = true из localStorage, но сессии в БД нет.
**Решение:** Проверять и store и cookie: `if (authStore.isAuthenticated && hasSession) return`.

### Community не загружает комнаты
**Причина:** Неправильное поле адреса (`address_street` вместо `address_district`).
**Решение:** Использовать те же поля что и в pg19v2client.

## Testing

1. Настроить Web App URL в BotFather → @PG19WEBAPP_bot
2. Открыть бота в Telegram → нажать кнопку
3. Проверить:
   - Dashboard показывает баланс и данные
   - Services показывает подключенные услуги
   - Community показывает комнаты чата
   - Profile показывает адрес подключения
