<script setup lang="ts">
/**
 * TWA Mobile Navigation
 * Нижняя навигация для Telegram Web App
 */
const route = useRoute()
const { haptic } = useTwa()

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: 'heroicons:home' },
  { name: 'Услуги', href: '/services', icon: 'heroicons:squares-2x2' },
  { name: 'Соседи', href: '/community', icon: 'heroicons:user-group' },
  { name: 'Счета', href: '/invoices', icon: 'heroicons:document-text' },
  { name: 'Ещё', href: '/more', icon: 'heroicons:ellipsis-horizontal' },
]

function isActive(href: string) {
  if (href === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/'
  }
  return route.path === href || route.path.startsWith(href + '/')
}

function handleNavClick() {
  haptic.selectionChanged()
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 border-t transition-[padding]"
    :style="{
      backgroundColor: 'var(--tg-bg-color, var(--bg-surface))',
      borderColor: 'var(--glass-border)',
      paddingBottom: 'var(--twa-safe-bottom, 0px)',
      paddingLeft: 'var(--twa-safe-left, 0px)',
      paddingRight: 'var(--twa-safe-right, 0px)',
    }"
  >
    <div class="flex items-center justify-around h-16">
      <NuxtLink
        v-for="item in navigation"
        :key="item.href"
        :to="item.href"
        prefetch
        class="flex flex-col items-center gap-1 py-2 px-3 transition-colors"
        :style="{
          color: isActive(item.href)
            ? 'var(--tg-button-color, var(--primary))'
            : 'var(--tg-hint-color, var(--text-muted))',
        }"
        @click="handleNavClick"
      >
        <Icon
          :name="item.icon"
          class="w-6 h-6"
        />
        <span class="text-xs font-medium">{{ item.name }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
