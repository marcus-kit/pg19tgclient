# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PG19 (ПЖ19) — a community ISP website built with Nuxt 4. This is the **main site** portal containing public pages, services information, and news.

**Other portals:** client (ЛК), admin (админка), partner (партнёры), land (лендинг) — see [Multi-Portal Architecture](#multi-portal-architecture).

**Language**: Russian UI, Russian comments acceptable.

## Nuxt Layer Architecture

**PG19v2 (main) является базовым Nuxt Layer**. Порталы client, admin, partner наследуют от него через `extends: ['../PG19v2']`.

### Что наследуется автоматически

| Категория | Путь | Пример |
|-----------|------|--------|
| UI компоненты | `app/components/` | `UButton`, `UCard`, `UInput`, `UBadge` |
| Chat компоненты | `app/components/chat/` | `ChatWidget`, `ChatWindow`, `ChatMessage` |
| Composables | `app/composables/` | `useChat`, `useSiteContent` |
| Стили | `app/assets/css/main.css` | CSS переменные, Tailwind классы |
| Типы | `types/` | `User`, `Chat`, `ChatMessage` |
| Server utils | `server/utils/` | `supabase.ts`, `mappers.ts` |
| Tailwind config | `tailwind.config.ts` | Brand colors, fonts |
| Nuxt modules | `nuxt.config.ts` | `@nuxt/icon`, `@nuxtjs/color-mode` |

### Что НЕ наследуется (portal-specific)

| Категория | Описание |
|-----------|----------|
| `app/pages/` | Каждый портал имеет свои страницы |
| `app/stores/` | Stores специфичны для каждого портала |
| `server/api/` | API endpoints для каждого портала |
| `app/middleware/` | Middleware (auth, guest) |
| `app/layouts/` | Layouts могут переопределяться |

### Важно для разработки

1. **Изменение UI компонентов** — меняй в PG19v2, автоматически появится во всех порталах
2. **Новые общие composables** — добавляй в PG19v2/app/composables/
3. **Не дублируй файлы** — если что-то нужно везде, добавь в base layer
4. **Деплой после изменений** — при изменении base layer нужно передеплоить все порталы

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
│   ├── useCoverageCheck.ts # Coverage zone check
│   ├── useDadataSuggest.ts # DaData address suggestions
│   └── useYandex*.ts      # Yandex Maps (geocoder, map picker)
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

### Address API (`/api/address/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/address/suggest` | POST | DaData address suggestions with coordinates |

### Geolocation API (`/api/geolocation/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geolocation/ip` | GET | IP-based geolocation fallback |

### Connection API (`/api/connection/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connection/create` | POST | Create connection request |

### Coverage API (`/api/coverage/`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/coverage/check` | POST | Check if coordinates are in coverage zone |

### Composables
```typescript
// CMS content loading
const { content, pending } = useSiteContent<T>('home')

// Services and TV channels
const { data } = useServices()
const { data } = useTvChannels()

// DaData address suggestions
const { suggestions, isLoading, getSuggestions, clearSuggestions } = useDadataSuggest()
await getSuggestions('Ростов-на-Дону, ул. Пушкинская')

// Coverage zone check
const { checkCoverage } = useCoverageCheck()
const result = await checkCoverage(lat, lon) // { inCoverage, zoneId, zoneName }
```

## Connection Form (`/connect`)

Форма подключения с адресной нормализацией через DaData.

### Компоненты
- `app/pages/connect.vue` — страница формы
- `app/components/connection/AddressInput.vue` — ввод адреса с подсказками DaData
- `app/components/connection/MapPicker.vue` — выбор адреса на карте Яндекс
- `app/components/connection/PhoneInput.vue` — ввод телефона с маской

### DaData Integration
API ключи хранятся в серверном `runtimeConfig` (не попадают в клиентский бандл):
```typescript
// nuxt.config.ts
runtimeConfig: {
  dadataApiKey: process.env.DADATA_API_KEY,
  dadataSecretKey: process.env.DADATA_SECRET_KEY,
}
```

Запросы к DaData проксируются через `/api/address/suggest` для безопасности.

### IP Geolocation Fallback
Если браузер не даёт доступ к геолокации, используется определение по IP через `/api/geolocation/ip` (ip-api.com).

### После отправки заявки
Пользователь перенаправляется в личный кабинет (pg19-client.doka.team) для отслеживания статуса.

## Database Schema

**Все ID в базе данных используют тип UUID** (миграции 032-041, завершено 2026-01-08). В TypeScript все `id` поля имеют тип `string`.

### Main Tables
| Table | Description |
|-------|-------------|
| `users` | User profiles, nickname, online_status, last_seen_at |
| `accounts` | User accounts (contract, balance, tariff, address) |
| `services` | Available services with features JSONB, category_id FK |
| `service_categories` | Категории услуг |
| `news` | News articles |
| `news_attachments` | Вложения к новостям (storage_path) |
| `connection_requests` | Connection request forms |

### Partner Tables
| Table | Description |
|-------|-------------|
| `partners` | Партнёры (auth_user_id для Supabase Auth) |
| `partner_coverage_zones` | Зоны покрытия партнёров (PostGIS geometry) |
| `partner_referrals` | Реферальные заявки партнёров |
| `partner_commissions` | Комиссии партнёров |
| `partner_payouts` | Выплаты партнёрам |

### Community Tables
| Table | Description |
|-------|-------------|
| `community_rooms` | Комнаты чата (city/district/building иерархия) |
| `community_members` | Участники комнат (role: member/moderator/admin) |
| `community_messages` | Сообщения в комнатах |
| `community_mutes` | Временные муты пользователей |
| `community_bans` | Баны пользователей |
| `community_reports` | Жалобы на сообщения |

### Support Tables
| Table | Description |
|-------|-------------|
| `tickets` | Тикеты поддержки |
| `ticket_comments` | Комментарии к тикетам |
| `ticket_history` | История изменений тикетов |
| `chats` | Chat sessions (user_telegram_id, guest_name, status) |
| `chat_messages` | Chat messages (sender_type: user/admin/system) |

### Other Tables
| Table | Description |
|-------|-------------|
| `achievements` | User achievements (gamification) |
| `referral_codes` | User referral codes |
| `referrals` | Invited users tracking |
| `auth_sessions` | Extended session info (device, browser, location) |
| `tv_channel_categories` | TV channel categories with counts |
| `site_content` | CMS content (page/section → JSONB) |

### Database Functions
| Function | Description |
|----------|-------------|
| `check_point_in_coverage(lat, lon)` | Проверка точки в зоне покрытия партнёра |
| `mark_chat_messages_read(chat_id, reader_type)` | Отметить сообщения прочитанными |
| `check_community_mute(room_id, user_id)` | Проверка мута в комнате |
| `ensure_community_rooms(city, district, building)` | Создание иерархии комнат |
| `get_community_unread_count(user_id, room_ids)` | Подсчёт непрочитанных |

### Shared Types (`types/chat.ts`)

Общие типы для чата используются в composables и API:
- `Chat`, `ChatMessage` — основные интерфейсы
- `SenderType` = 'user' | 'admin' | 'system'
- `ChatStatus` = 'active' | 'waiting' | 'processing' | 'closed' | 'resolved'

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
  sessionId: string | null  // UUID текущей сессии (persisted)
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

### Phone Input

Для ввода телефона используй компонент `ConnectionPhoneInput`:

```vue
<ConnectionPhoneInput
  v-model="phone"
  label="Телефон"
  @validation="onPhoneValidation"
/>
```

- Использует IMask для форматирования (+7 (___) ___-__-__)
- `v-model` возвращает только цифры (79991234567)
- Эмитит `@validation` с boolean при изменении валидности

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
4. **Nuxt Layer inheritance** — client, admin, partner наследуют от main через `extends`
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
