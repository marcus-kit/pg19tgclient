<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const colorMode = useColorMode()

const navigation = [
  { name: 'Главная', href: '/lk/dashboard', icon: 'heroicons:home' },
  { name: 'Услуги', href: '/lk/services', icon: 'heroicons:squares-2x2' },
  { name: 'Счета', href: '/lk/invoices', icon: 'heroicons:document-text' },
  { name: 'Поддержка', href: '/lk/support', icon: 'heroicons:chat-bubble-left-right' }
]

const isActive = (href: string) => route.path === href

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/lk/login')
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t" style="background: var(--header-blur-bg); border-color: var(--glass-border);">
    <div class="flex items-center justify-around h-16 px-2">
      <NuxtLink
        v-for="item in navigation"
        :key="item.href"
        :to="item.href"
        class="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors"
        :class="isActive(item.href) ? 'text-primary' : 'text-[var(--text-muted)]'"
      >
        <Icon :name="item.icon" class="w-6 h-6" />
        <span class="text-xs font-medium">{{ item.name }}</span>
      </NuxtLink>

      <button
        @click="toggleTheme"
        class="flex flex-col items-center gap-1 py-2 px-3 rounded-lg text-[var(--text-muted)] hover:text-primary transition-colors"
      >
        <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-6 h-6" />
        <span class="text-xs font-medium">Тема</span>
      </button>

      <button
        @click="handleLogout"
        class="flex flex-col items-center gap-1 py-2 px-3 rounded-lg text-[var(--text-muted)] hover:text-primary transition-colors"
      >
        <Icon name="heroicons:arrow-right-on-rectangle" class="w-6 h-6" />
        <span class="text-xs font-medium">Выход</span>
      </button>
    </div>
  </nav>
</template>
