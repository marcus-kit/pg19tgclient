<script setup lang="ts">
/**
 * TWA Header
 * Минималистичный хедер для Telegram Web App
 * Логотип по центру с аватаром пользователя
 */
const authStore = useAuthStore()
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b"
    :style="{
      backgroundColor: 'var(--tg-header-bg-color, rgba(28, 28, 30, 0.9))',
      borderColor: 'var(--glass-border)',
      paddingTop: 'var(--twa-safe-top, 0px)',
      paddingLeft: 'var(--twa-safe-left, 0px)',
      paddingRight: 'var(--twa-safe-right, 0px)',
      height: 'calc(56px + var(--twa-safe-top, 0px))',
    }"
  >
    <div class="h-full px-4 flex items-center justify-center gap-3">
      <!-- Logo -->
      <img
        src="/logo.png"
        alt="ПЖ19"
        class="h-8 w-auto"
      >

      <!-- Avatar -->
      <NuxtLink
        v-if="authStore.isAuthenticated"
        to="/profile"
        class="shrink-0"
      >
        <div
          v-if="authStore.user?.avatar"
          class="w-9 h-9 rounded-full bg-cover bg-center border-2"
          :style="{
            backgroundImage: `url(${authStore.user.avatar})`,
            borderColor: 'var(--tg-button-color, var(--primary))',
          }"
        />
        <div
          v-else
          class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            color: 'var(--tg-button-text-color, #fff)',
          }"
        >
          {{ authStore.user?.firstName?.charAt(0) || 'U' }}
        </div>
      </NuxtLink>
    </div>
  </header>
</template>
