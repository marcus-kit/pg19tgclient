<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const colorMode = useColorMode()
const isScrolled = ref(false)

const navigation = [
  { name: 'Главная', href: '/lk/dashboard', icon: 'heroicons:home' },
  { name: 'Услуги', href: '/lk/services', icon: 'heroicons:squares-2x2' },
  { name: 'Счета', href: '/lk/invoices', icon: 'heroicons:document-text' },
  { name: 'Поддержка', href: '/lk/support', icon: 'heroicons:chat-bubble-left-right' },
  { name: 'Профиль', href: '/lk/profile', icon: 'heroicons:user' }
]

const isActive = (href: string) => route.path === href

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/lk/login')
}

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
  }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="isScrolled ? 'header-blur shadow-lg' : 'header-transparent'"
  >
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/logo.png" alt="ПЖ19" class="h-8" />
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in navigation"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.href) ? 'text-primary bg-primary/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- User Info & Actions -->
        <div class="hidden md:flex items-center gap-3">
          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="theme-toggle"
            :title="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
          >
            <Icon
              :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'"
              class="w-5 h-5"
            />
          </button>

          <div class="text-right">
            <p class="text-sm font-medium text-[var(--text-primary)]">{{ authStore.shortName }}</p>
            <p class="text-xs text-[var(--text-muted)]">Договор {{ authStore.account?.contractNumber }}</p>
          </div>
          <button
            @click="handleLogout"
            class="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
            title="Выйти"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
