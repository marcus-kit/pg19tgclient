# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PG19 (ПЖ19) — a community ISP website built with Nuxt 4. Includes a public landing site and a personal cabinet (личный кабинет) for subscribers.

**Language**: Russian UI, Russian comments acceptable.

## Commands

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture

### Directory Structure
```
app/
├── pages/
│   ├── index.vue          # Landing page
│   ├── internet.vue       # Service pages (tv, mobile, cctv, intercom)
│   └── lk/                # Personal cabinet (requires auth)
│       ├── login.vue
│       ├── dashboard.vue
│       ├── profile.vue
│       ├── invoices.vue
│       ├── services.vue
│       └── support.vue
├── components/
│   ├── ui/                # Reusable UI: UButton, UCard, UBadge, UInput
│   ├── lk/                # LK layout: LkHeader, LkMobileNav
│   ├── dashboard/         # Dashboard widgets
│   ├── profile/           # Profile sections
│   └── layout/            # Public site: AppHeader, AppFooter
├── layouts/
│   ├── default.vue        # Public pages
│   ├── lk.vue             # Personal cabinet
│   └── guest.vue          # Login page
├── stores/
│   └── auth.ts            # Pinia store: user, account, notifications, sessions, achievements
└── middleware/
    └── auth.ts            # Route protection
```

### Key Patterns

**Component auto-import**: Components in `ui/` and `lk/` have `pathPrefix: false` — use `UButton` not `UiUButton`.

**State management**: Pinia store `useAuthStore()` handles auth state with localStorage persistence. Uses mock data for development. Call `hydrate()` on app init to restore session.

**Layouts**: Pages in `/lk/*` use `definePageMeta({ layout: 'lk', middleware: 'auth' })`.

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
}
```

Balance stored in kopeks (копейки), divide by 100 for rubles display.

## Component Patterns

- Use `glass-card` class for glassmorphism cards
- Icon containers: `bg-gradient-to-br from-primary/20 to-secondary/10`
- Animation classes: `animate-fade-in-up`, `stagger-1` through `stagger-6`
- Mesh gradient backgrounds: `mesh-gradient-hero`, `mesh-gradient-dark`

## Git Worktrees & Deployment

### Структура worktrees

| Branch | Worktree Path | URL | Назначение |
|--------|---------------|-----|------------|
| `main` | `/Users/doka/PG19v2` | pg19.doka.team | Production |
| `partner` | `/Users/doka/PG19v2partner` | pg19-partner.doka.team | Partner portal preview |

### Команды деплоя

```bash
# Из директории /Users/doka/PG19v2
./deploy.sh main           # Деплой main → pg19.doka.team
./deploy.sh partner        # Деплой partner → pg19-partner.doka.team
./deploy.sh all            # Деплой всех веток
./deploy.sh --status       # Статус всех контейнеров
./deploy.sh main --no-build  # Рестарт без пересборки
```

### Процесс деплоя

1. **rsync** — код из worktree синхронизируется на сервер (`doka-server:/opt/pg19v2-{branch}/`)
2. **docker-compose** — копируется из `deploy/docker-compose.{branch}.yml`
3. **docker build** — сборка образа с build-time ARGs (SUPABASE_URL, SUPABASE_KEY, etc.)
4. **docker up** — запуск контейнера в сети `pg19-network`
5. **Traefik** — роутит запросы по Host header

### Конфигурация

**Docker Compose файлы:** `/Users/doka/PG19v2/deploy/`
- `docker-compose.main.yml`
- `docker-compose.partner.yml`

**Build-time ARGs (вшиваются в бандл):**
- `SUPABASE_URL` — URL Supabase API
- `SUPABASE_KEY` — Anon key (публичный)
- `TELEGRAM_BOT_USERNAME` — Имя бота для авторизации
- `YANDEX_MAPS_API_KEY` — API ключ Яндекс Карт (только partner)

**Runtime ENV (серверные секреты):**
- `NUXT_TELEGRAM_BOT_TOKEN` — Токен Telegram бота
- `NUXT_SUPABASE_SERVICE_KEY` — Service role key

### Правила работы с worktrees

1. **Каждый worktree = отдельная директория** — переключайся через `cd`, не через `git checkout`
2. **Коммить перед деплоем** — `deploy.sh` берёт файлы из файловой системы, не из git
3. **Не мержи без необходимости** — ветки могут расходиться, это нормально
4. **Проверяй статус** — `./deploy.sh --status` покажет состояние контейнеров

### Создание нового worktree

```bash
cd /Users/doka/PG19v2
git worktree add ../PG19v2newbranch -b newbranch

# Создать docker-compose.newbranch.yml в deploy/
# Добавить case в deploy.sh для нового branch
```

### Удаление worktree

```bash
git worktree remove /Users/doka/PG19v2oldbranch
git branch -d oldbranch  # если ветка больше не нужна
```
