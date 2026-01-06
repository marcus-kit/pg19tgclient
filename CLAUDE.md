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
│   ├── ui/                # Reusable UI: UButton, UCard, UBadge, UInput
│   ├── home/              # Home page sections
│   ├── layout/            # AppHeader, AppFooter
│   └── news/              # News components
├── layouts/
│   ├── default.vue        # Main layout
│   └── guest.vue          # Minimal layout
├── stores/
│   └── auth.ts            # Pinia store (shared across portals)
└── middleware/
    └── auth.ts            # Route protection
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

## Multi-Portal Architecture

Проект разделён на 5 независимых порталов, каждый в своём worktree:

| Portal | Worktree | Prod URL | Dev URL | Контент |
|--------|----------|----------|---------|---------|
| `main` | `/Users/doka/PG19v2` | pg19.doka.team | dev.pg19.doka.team | Основной сайт, сервисы, новости |
| `land` | `/Users/doka/PG19v2land` | land.pg19.doka.team | dev-land.pg19.doka.team | Landing page |
| `partner` | `/Users/doka/PG19v2partner` | partner.pg19.doka.team | dev-partner.pg19.doka.team | Партнёрский портал |
| `client` | `/Users/doka/PG19v2client` | client.pg19.doka.team | dev-client.pg19.doka.team | Личный кабинет |
| `admin` | `/Users/doka/PG19v2admin` | admin.pg19.doka.team | dev-admin.pg19.doka.team | Админ-панель |

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
3. Проверяешь на `dev-<portal>.pg19.doka.team`
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
- `pg19-land` → land.pg19.doka.team
- `pg19-partner` → partner.pg19.doka.team
- `pg19-client` → client.pg19.doka.team
- `pg19-admin` → admin.pg19.doka.team

**Development:**
- `pg19-dev-main` → dev.pg19.doka.team
- `pg19-dev-land` → dev-land.pg19.doka.team
- `pg19-dev-partner` → dev-partner.pg19.doka.team
- `pg19-dev-client` → dev-client.pg19.doka.team
- `pg19-dev-admin` → dev-admin.pg19.doka.team
