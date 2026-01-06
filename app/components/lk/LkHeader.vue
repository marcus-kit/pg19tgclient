<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const navigation = [
  { name: 'Главная', href: '/lk/dashboard', icon: 'heroicons:home' },
  { name: 'Услуги', href: '/lk/services', icon: 'heroicons:squares-2x2' },
  { name: 'Счета', href: '/lk/invoices', icon: 'heroicons:document-text' },
  { name: 'Поддержка', href: '/lk/support', icon: 'heroicons:chat-bubble-left-right' },
  { name: 'Профиль', href: '/lk/profile', icon: 'heroicons:user' }
]

const isActive = (href: string) => route.path === href

const handleLogout = () => {
  authStore.logout()
  navigateTo('/lk/login')
}
</script>

<template>
  <header class="sticky top-0 z-50 header-blur">
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
            :class="isActive(item.href) ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- User Info & Logout -->
        <div class="hidden md:flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-medium text-white">{{ authStore.shortName }}</p>
            <p class="text-xs text-gray-400">Договор {{ authStore.account?.contractNumber }}</p>
          </div>
          <button
            @click="handleLogout"
            class="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Выйти"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
