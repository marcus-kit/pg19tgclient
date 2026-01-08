<script setup lang="ts">
/**
 * TWA Header
 * Упрощённый хедер для Telegram Web App
 * Без кнопки назад (она в Telegram)
 */
const authStore = useAuthStore()

// Форматирование баланса
const formattedBalance = computed(() => {
  const rubles = authStore.balanceRubles
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(rubles)
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-lg border-b"
    :style="{
      backgroundColor: 'var(--tg-header-bg-color, rgba(28, 28, 30, 0.9))',
      borderColor: 'var(--glass-border)',
      paddingTop: 'var(--twa-safe-top, 0px)'
    }"
  >
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span class="text-white font-bold text-sm">ПЖ</span>
        </div>
        <span class="font-semibold text-[var(--tg-text-color,#fff)]">ПЖ19</span>
      </div>

      <!-- User info -->
      <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
        <!-- Balance -->
        <div class="text-right">
          <p
            class="text-sm font-medium"
            :class="authStore.isBlocked ? 'text-[var(--destructive)]' : 'text-[var(--tg-text-color,#fff)]'"
          >
            {{ formattedBalance }}
          </p>
          <p class="text-xs text-[var(--tg-hint-color,#8b8b8b)]">
            № {{ authStore.account?.contractNumber }}
          </p>
        </div>

        <!-- Avatar -->
        <NuxtLink to="/profile" class="shrink-0">
          <div
            v-if="authStore.user?.avatar"
            class="w-9 h-9 rounded-full bg-cover bg-center border-2"
            :style="{
              backgroundImage: `url(${authStore.user.avatar})`,
              borderColor: 'var(--tg-button-color, var(--primary))'
            }"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
            :style="{
              backgroundColor: 'var(--tg-button-color, var(--primary))',
              color: 'var(--tg-button-text-color, #fff)'
            }"
          >
            {{ authStore.user?.firstName?.charAt(0) || 'U' }}
          </div>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
