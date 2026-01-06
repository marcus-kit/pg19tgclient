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
