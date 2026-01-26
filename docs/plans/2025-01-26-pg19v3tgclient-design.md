# pg19v3tgclient — Design Document

## Overview

Автономный Telegram Web App клиент для ПЖ19, без зависимости от parent layer (PG19v2). Полный функционал pg19v2tgclient с современным стеком.

**Домен:** pg19v3-tg.doka.team

## Technology Stack

| Component | Version |
|-----------|---------|
| Framework | Nuxt 4.3+ |
| Vue | 3.5 |
| UI Library | Nuxt UI v4 |
| State | Pinia + persistedstate |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (supabase.doka.team) |
| Package Manager | pnpm |
| Node | 24 |
| Deploy | Dokploy + Dockerfile |
| Linting | @nuxt/eslint + ESLint 9 |

## Project Structure

```
pg19v3tgclient/
├── app/
│   ├── assets/css/main.css      # Telegram theme variables
│   ├── components/
│   │   ├── twa/                  # TwaMobileNav, TwaHeader
│   │   ├── dashboard/           # BalanceCard, QuickActions, etc.
│   │   ├── community/           # Chat components
│   │   ├── profile/             # Profile components
│   │   └── support/             # Ticket components
│   ├── composables/
│   │   ├── useTwa.ts            # vue-tg wrapper
│   │   ├── useInvoices.ts
│   │   ├── useServices.ts
│   │   ├── useTickets.ts
│   │   ├── useCommunityChat.ts
│   │   ├── useNews.ts
│   │   └── useFaq.ts
│   ├── layouts/twa.vue
│   ├── middleware/twa-auth.global.ts
│   ├── pages/
│   │   ├── index.vue            # Redirect to /dashboard
│   │   ├── dashboard.vue
│   │   ├── services.vue
│   │   ├── invoices.vue
│   │   ├── community.vue
│   │   ├── profile.vue
│   │   └── support/
│   │       ├── index.vue
│   │       └── [id].vue
│   ├── plugins/
│   │   └── telegram-webapp.client.ts
│   ├── stores/auth.ts
│   └── types/
├── server/
│   ├── api/
│   │   ├── auth/twa.post.ts
│   │   ├── user/
│   │   ├── invoices/
│   │   ├── services/
│   │   ├── tickets/
│   │   └── community/
│   └── utils/
│       ├── supabase.ts
│       └── userAuth.ts
├── public/
├── nuxt.config.ts
├── app.config.ts                # Nuxt UI theme
├── eslint.config.mjs
├── Dockerfile
├── .dockerignore
└── package.json
```

## UI Components

### Nuxt UI v4 Replacements

| Old (pg19v2) | Nuxt UI v4 |
|--------------|------------|
| UButton | `<UButton>` |
| UCard | `<UCard>` |
| UInput | `<UInput>` |
| USelect | `<USelectMenu>` |
| UBadge | `<UBadge>` |
| UModal | `<UModal>` |

### Custom Components (remain)

- `twa/TwaMobileNav.vue` — TWA navigation
- `twa/TwaHeader.vue` — BackButton API integration
- `community/*` — Chat components
- `dashboard/*` — Business logic components

### Telegram Theme (app.config.ts)

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',      // Telegram blue
      secondary: 'slate',
      neutral: 'slate'
    }
  }
})
```

## Authentication

### Stack

| Layer | Package | Purpose |
|-------|---------|---------|
| Client | `vue-tg` | WebApp API composables |
| Server | `@tma.js/init-data-node` | initData validation |

### Client: vue-tg wrapper

```typescript
// composables/useTwa.ts
import { useMiniApp, useMainButton, useBackButton, useHapticFeedback } from 'vue-tg'

export function useTwa() {
  const miniApp = useMiniApp()
  const mainButton = useMainButton()
  const backButton = useBackButton()
  const haptic = useHapticFeedback()

  const initData = computed(() => miniApp.initData)
  const initDataRaw = computed(() => miniApp.initDataRaw)
  const user = computed(() => miniApp.initData?.user)

  return { miniApp, mainButton, backButton, haptic, initData, initDataRaw, user }
}
```

### Server: validation

```typescript
// server/api/auth/twa.post.ts
import { validate, parse } from '@tma.js/init-data-node'

export default defineEventHandler(async (event) => {
  const { initDataRaw } = await readBody(event)

  validate(initDataRaw, process.env.TELEGRAM_BOT_TOKEN, {
    expiresIn: 3600
  })

  const initData = parse(initDataRaw)
  // ... create/update user in Supabase
  // ... set cookie session
})
```

### Cookie settings

```typescript
setCookie(event, 'session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',  // Required for Telegram WebView
  maxAge: 60 * 60 * 24 * 30
})
```

## Dockerfile

```dockerfile
# Build stage
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG TELEGRAM_BOT_USERNAME

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}
ENV TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

## Dokploy Configuration

| Parameter | Value |
|-----------|-------|
| Type | Application (Dockerfile) |
| Domain | pg19v3-tg.doka.team |
| Port | 3000 |

### Build Arguments (public)

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `TELEGRAM_BOT_USERNAME`

### Environment (server-only secrets)

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SERVICE_KEY`

## Dependencies

```json
{
  "name": "pg19v3-tgclient",
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "nuxt": "^4.3.0",
    "vue": "^3.5.0",
    "@nuxt/ui": "^4.0.0",
    "@nuxtjs/supabase": "^2.0.0",
    "@pinia/nuxt": "^0.11.0",
    "pinia-plugin-persistedstate": "^4.0.0",
    "vue-tg": "^0.7.0",
    "@tma.js/init-data-node": "^2.0.4"
  },
  "devDependencies": {
    "@nuxt/eslint": "^1.0.0",
    "eslint": "^9.0.0"
  }
}
```

## Implementation Order

1. **Initialization**
   - pnpm create nuxt (Nuxt 4)
   - Add @nuxt/ui (v4)
   - Add @nuxt/eslint
   - Configure Tailwind CSS v4
   - Configure app.config.ts (Telegram theme)

2. **Infrastructure**
   - Dockerfile (Node 24, pnpm)
   - .dockerignore
   - nuxt.config.ts
   - tsconfig.json

3. **Authentication**
   - pnpm add vue-tg @tma.js/init-data-node
   - plugins/telegram-webapp.client.ts
   - composables/useTwa.ts
   - middleware/twa-auth.global.ts
   - server/api/auth/twa.post.ts
   - stores/auth.ts

4. **UI and Layout**
   - app.vue
   - layouts/twa.vue
   - components/twa/TwaMobileNav.vue
   - assets/css/main.css

5. **Pages (by priority)**
   - pages/index.vue (redirect)
   - pages/dashboard.vue + components
   - pages/profile.vue + components
   - pages/invoices.vue
   - pages/services.vue
   - pages/support/index.vue + [id].vue
   - pages/community.vue + components

6. **Deploy**
   - Create app in Dokploy
   - Configure Build Arguments
   - Configure Environment
   - Bind domain pg19v3-tg.doka.team
