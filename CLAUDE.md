# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ПЖ19 (PG19) website - a Russian ISP cooperative landing page. The site emphasizes that PG19 is a community (сообщество), not a commercial provider, with no artificial speed limits.

## Commands

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
npm run generate     # Static site generation
```

## Tech Stack

- **Nuxt 4** with `app/` directory structure (not `src/`)
- **Tailwind CSS** with custom theme colors
- **@nuxtjs/color-mode** for light/dark theme switching
- **@nuxt/icon** with Heroicons (`heroicons:*`)
- **Google Fonts**: Outfit (400-800 weights)

## Architecture

### Directory Structure
```
app/
├── assets/css/main.css    # CSS variables for theming
├── components/
│   ├── home/              # Homepage sections (HeroSection, ServicesGrid, WhyUsSection)
│   └── layout/            # AppHeader, AppFooter
├── layouts/default.vue    # Main layout with header/footer
└── pages/                 # Route pages (internet, tv, mobile, etc.)
```

### Theming System

Theme is controlled via CSS variables in `app/assets/css/main.css`:
- Light theme: `:root { ... }`
- Dark theme: `.dark { ... }`

Key variables: `--bg-base`, `--text-primary`, `--text-muted`, `--glass-bg`, `--header-bg`

Use `useColorMode()` composable to toggle themes:
```vue
const colorMode = useColorMode()
colorMode.preference = 'dark' // or 'light'
```

### Brand Colors (tailwind.config.ts)

| Color | Hex | Usage |
|-------|-----|-------|
| primary | #F7941D | Orange - main accent |
| secondary | #E91E8C | Magenta - highlights |
| accent | #00A651 | Green - success/positive |
| info | #0054A6 | Blue - informational |

### Component Patterns

- Use `glass-card` class for glassmorphism cards
- Animation classes: `animate-fade-in-up`, `stagger-1` through `stagger-6` for staggered animations
- Mesh gradient backgrounds: `mesh-gradient-hero`, `mesh-gradient-dark`
- Always use CSS variables for colors: `text-[var(--text-primary)]` instead of hardcoded values

### Auto-imports

Nuxt auto-imports Vue composables and components. No need to import:
- `ref`, `reactive`, `computed`, `onMounted`
- Components from `components/` (prefix with folder: `HomeHeroSection`, `LayoutAppHeader`)
- `useHead()`, `useColorMode()`, `NuxtLink`, `Icon`
