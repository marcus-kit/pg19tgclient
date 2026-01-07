# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PG19 (ПЖ19) — a community ISP website built with Nuxt 4. This is the **main site** portal containing public pages, services information, and news.

**Other portals:** client (ЛК), admin (админка), partner (партнёры), land (лендинг) — see [Multi-Portal Architecture](#multi-portal-architecture).

**Language**: Russian UI, Russian comments acceptable.

## Commands

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture (main portal)

### Directory Structure
```
app/
├── pages/
│   ├── index.vue          # Home page
│   ├── internet.vue       # Service pages (tv, mobile, cctv, intercom)
│   ├── about.vue          # About page
│   ├── business.vue       # Business services
│   ├── partners.vue       # Partners page
│   ├── connect.vue        # Connection form
│   └── news/              # News section
├── components/
│   ├── ui/                # Reusable UI: UButton, UBadge, UInput
│   ├── home/              # Home page sections (HeroSection, ServicesGrid)
│   ├── layout/            # AppHeader, AppFooter
│   ├── chat/              # Chat widget (ChatWidget, ChatWindow, ChatMessage, ChatGuestForm)
│   └── news/              # News components
├── composables/
│   ├── useSiteContent.ts  # CMS content from Supabase
│   ├── useChat.ts         # Chat session & messages with Realtime
│   ├── useCoverageCheck.ts
│   └── useYandex*.ts      # Yandex Maps integration
├── layouts/
│   └── default.vue        # Main layout (includes ChatWidget)
├── stores/
│   ├── auth.ts            # Pinia store with API loading
│   └── chat.ts            # Chat state (isOpen, sessionId, unreadCount)
server/
├── api/
│   ├── auth/              # Telegram, contract auth
│   ├── user/              # User profile, achievements, sessions, referral
│   ├── content/           # CMS content, services, TV channels
│   ├── chat/              # Chat sessions and messages
│   ├── news/              # News CRUD
│   └── connection/        # Connection requests
```

### Key Patterns

**Component auto-import**: Components in `ui/` have `pathPrefix: false` — use `UButton` not `UiUButton`.

**State management**: Pinia store `useAuthStore()` handles auth state with localStorage persistence.

**Layouts**: Public pages use default layout.

**Styling**: Dark theme with glassmorphism. Brand colors defined in `tailwind.config.ts`:
- `primary`: #F7941D (orange)
- `secondary`: #E91E8C (pink)
- `accent`: #00A651 (green)

**Icons**: Use `@nuxt/icon` with heroicons and simple-icons: `<Icon name="heroicons:user" />`.

## Theming System

Theme is controlled via CSS variables in `app/assets/css/main.css`:
- Light theme: `:root { ... }`
- Dark theme: `.dark { ... }`

Key variables: `--bg-base`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--text-muted`, `--glass-bg`, `--glass-border`

Always use CSS variables for colors: `text-[var(--text-primary)]` instead of hardcoded values.

For light/dark specific styling use Tailwind's `dark:` modifier: `bg-gray-200 dark:bg-white/10`

Toggle theme with:
```vue
const colorMode = useColorMode()
colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
```

## API Endpoints

### User API (`/api/user/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/update` | POST | Update user profile |
| `/api/user/achievements` | GET | User achievements |
| `/api/user/referral` | GET | Referral program data |
| `/api/user/sessions` | GET | Active sessions list |
| `/api/user/sessions/[id]` | DELETE | Terminate session |
| `/api/user/notifications` | GET/PUT | Notification settings |

### Content API (`/api/content/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content/page/[page]` | GET | CMS content by page (home, internet, tv) |
| `/api/content/services` | GET | Services list |
| `/api/content/tv-channels` | GET | TV channel categories |

### Chat API (`/api/chat/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/session` | POST | Create or get existing chat session |
| `/api/chat/messages` | GET | Load chat messages (with pagination) |
| `/api/chat/send` | POST | Send message to chat |
| `/api/chat/close` | POST | Close chat session |

**Database tables:** `chats`, `chat_messages`

**Realtime:** Subscribed via Supabase channels for new messages.

### Composables
```typescript
// CMS content loading
const { content, pending } = useSiteContent<T>('home')

// Services and TV channels
const { data } = useServices()
const { data } = useTvChannels()
```

## Database Schema

### Main Tables
| Table | Description |
|-------|-------------|
| `users` | User profiles with notifications_settings JSONB |
| `accounts` | User accounts (contract, balance, tariff) |
| `services` | Available services with features JSONB |
| `news` | News articles |
| `connection_requests` | Connection request forms |

### New Tables (2026-01-07)
| Table | Description |
|-------|-------------|
| `achievements` | User achievements (gamification) |
| `referral_codes` | User referral codes |
| `referrals` | Invited users tracking |
| `auth_sessions` | Extended session info (device, browser, location) |
| `tv_channel_categories` | TV channel categories with counts |
| `site_content` | CMS content (page/section → JSONB) |
| `chats` | Chat sessions (user_id, guest_name, status, assigned_admin) |
| `chat_messages` | Chat messages (chat_id, sender_type, content) |

## Auth Store Structure

```typescript
interface AuthState {
  isAuthenticated: boolean
  user: User | null           // firstName, lastName, phone, email, telegram, vkId, avatar, birthDate
  account: Account | null     // contractNumber, balance (kopeks), status, tariff, address
  notifications: NotificationSettings
  sessions: LoginSession[]
  achievements: Achievement[]
  referralProgram: ReferralProgram | null
  loading: { achievements, sessions, referral, notifications }
}
```

**API Loading**: Store methods `loadAchievements()`, `loadSessions()`, `loadReferralProgram()`, `loadNotifications()` fetch data from API. Called automatically in `setAuthData()` and `hydrate()`.

Balance stored in kopeks (копейки), divide by 100 for rubles display.

## Chat System

Встроенный чат с операторами поддержки. Поддерживает авторизованных пользователей и гостей.

### Architecture

```
Main Site (user)                    Admin Portal (operator)
─────────────────                   ────────────────────────
ChatWidget.vue                      pages/chat/index.vue (список чатов)
  └── ChatWindow.vue                pages/chat/[id].vue (диалог)
        └── ChatMessage.vue
        └── ChatGuestForm.vue

useChat.ts composable               Admin API endpoints
chat.ts Pinia store                 /api/admin/chat/

              ↓ Supabase Realtime ↓

Database: chats, chat_messages
```

### Chat Store (`app/stores/chat.ts`)

```typescript
interface ChatState {
  isOpen: boolean      // Окно чата открыто/закрыто
  isMinimized: boolean // Свёрнуто в виджет
  sessionId: number | null  // ID текущей сессии (persisted)
  guestName: string | null  // Имя гостя (persisted)
  unreadCount: number       // Непрочитанные сообщения
}
```

**Persistence**: Используется `pinia-plugin-persistedstate` для сохранения `sessionId` и `guestName` в localStorage. Плагин подключен в `app/plugins/pinia-persist.client.ts`.

### Session Restoration Flow

1. `ChatWindow.vue` при `onMounted` читает `chatStore.sessionId`
2. Если есть sessionId → вызывает `initSession({ chatId: sessionId })`
3. API `session.post.ts` ищет чат по ID в статусе `active` или `waiting`
4. Если найден → возвращает существующую сессию с историей
5. Если не найден → показывает форму гостя или создаёт новый чат

### Guest Support

Гости вводят имя и контакт (опционально) через `ChatGuestForm.vue`:
- `guest_name` — отображается в админке
- `guest_contact` — телефон/email для связи

В админ-панели гости отмечены бейджем "Гость" с фиолетовым цветом.

## Component Patterns

- Use `glass-card` class for glassmorphism cards
- Icon containers: `bg-gradient-to-br from-primary/20 to-secondary/10`
- Animation classes: `animate-fade-in-up`, `stagger-1` through `stagger-6`
- Mesh gradient backgrounds: `mesh-gradient-hero`, `mesh-gradient-dark`

## Multi-Portal Architecture

Проект разделён на 5 независимых порталов, каждый в своём worktree:

| Portal | Worktree | Prod URL | Dev URL | Контент |
|--------|----------|----------|---------|---------|
| `main` | `/Users/doka/PG19v2` | pg19.doka.team | dev-pg19.doka.team | Основной сайт, сервисы, новости |
| `land` | `/Users/doka/PG19v2land` | pg19-land.doka.team | dev-pg19-land.doka.team | Landing page |
| `partner` | `/Users/doka/PG19v2partner` | pg19-partner.doka.team | dev-pg19-partner.doka.team | Партнёрский портал |
| `client` | `/Users/doka/PG19v2client` | pg19-client.doka.team | dev-pg19-client.doka.team | Личный кабинет |
| `admin` | `/Users/doka/PG19v2admin` | pg19-admin.doka.team | dev-pg19-admin.doka.team | Админ-панель |

### Команды деплоя

```bash
# Из директории /Users/doka/PG19v2
./deploy.sh client              # Деплой client в prod
./deploy.sh client dev          # Деплой client в dev
./deploy.sh partner prod        # Деплой partner в prod
./deploy.sh all dev             # Деплой всех порталов в dev
./deploy.sh --status            # Статус всех контейнеров
./deploy.sh admin --no-build    # Рестарт admin без пересборки
```

### Workflow: dev → prod

1. Разрабатываешь в worktree
2. `./deploy.sh <portal> dev` — деплой в dev для тестирования
3. Проверяешь на `dev-pg19-<portal>.doka.team`
4. `./deploy.sh <portal> prod` — деплой в production

### Процесс деплоя

1. **mkdir** — создаёт директорию на сервере (`/opt/pg19-<portal>` или `/opt/pg19-dev-<portal>`)
2. **rsync** — синхронизирует код из worktree
3. **generate_compose** — генерирует docker-compose.yml с правильным URL и контейнером
4. **docker build** — сборка образа с build-time ARGs
5. **docker up** — запуск контейнера в сети `pg19-network`
6. **Traefik** — роутит запросы по Host header

### Конфигурация

**Build-time ARGs (вшиваются в бандл):**
- `SUPABASE_URL` — https://supabase.doka.team
- `SUPABASE_KEY` — Anon key (публичный)
- `TELEGRAM_BOT_USERNAME` — PG19CONNECTBOT
- `YANDEX_MAPS_API_KEY` — API ключ Яндекс Карт

**Runtime ENV (серверные секреты):**
- `NUXT_TELEGRAM_BOT_TOKEN` — Токен Telegram бота
- `NUXT_SUPABASE_SERVICE_KEY` — Service role key

### Правила работы с worktrees

1. **Каждый worktree = отдельная директория** — переключайся через `cd`, не через `git checkout`
2. **Коммить перед деплоем** — `deploy.sh` берёт файлы из файловой системы
3. **Порталы независимы** — каждый портал имеет свой набор страниц и компонентов
4. **Общие стили** — `tailwind.config.ts` и `main.css` одинаковы во всех worktrees
5. **Проверяй статус** — `./deploy.sh --status` покажет все контейнеры

### Структура контейнеров

**Production:**
- `pg19-main` → pg19.doka.team
- `pg19-land` → pg19-land.doka.team
- `pg19-partner` → pg19-partner.doka.team
- `pg19-client` → pg19-client.doka.team
- `pg19-admin` → pg19-admin.doka.team

**Development:**
- `pg19-dev-main` → dev-pg19.doka.team
- `pg19-dev-land` → dev-pg19-land.doka.team
- `pg19-dev-partner` → dev-pg19-partner.doka.team
- `pg19-dev-client` → dev-pg19-client.doka.team
- `pg19-dev-admin` → dev-pg19-admin.doka.team
