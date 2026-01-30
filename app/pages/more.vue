<script setup lang="ts">
/**
 * Страница "Ещё"
 * Дополнительное меню с настройками и выходом
 */
definePageMeta({
  layout: 'twa',
})

const authStore = useAuthStore()
const { webApp, haptic } = useTwa()

const menuItems = [
  { name: 'Поддержка', href: '/support', icon: 'heroicons:chat-bubble-left-right', description: 'Тикеты и FAQ' },
  { name: 'Профиль', href: '/profile', icon: 'heroicons:user', description: 'Настройки аккаунта' },
  { name: 'Вход на сайте', href: '/scan-qr', icon: 'heroicons:qr-code', description: 'Авторизация по QR-коду' },
]

async function handleLogout() {
  haptic.impactOccurred('medium')
  authStore.logout()
  webApp.close()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--tg-text-color,#fff)]">
        Ещё
      </h1>
      <p class="text-[var(--tg-hint-color,#8b8b8b)] mt-1">
        Дополнительные настройки
      </p>
    </div>

    <!-- Menu Items -->
    <div class="space-y-2">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-4 p-4 rounded-xl transition-colors"
        :style="{
          backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))',
        }"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            opacity: 0.2,
          }"
        >
          <Icon
            :name="item.icon"
            class="w-5 h-5"
            :style="{ color: 'var(--tg-button-color, var(--primary))' }"
          />
        </div>
        <div class="flex-1">
          <p class="font-medium text-[var(--tg-text-color,#fff)]">{{ item.name }}</p>
          <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)]">{{ item.description }}</p>
        </div>
        <Icon
          name="heroicons:chevron-right"
          class="w-5 h-5 text-[var(--tg-hint-color,#8b8b8b)]"
        />
      </NuxtLink>
    </div>

    <!-- User Info Card -->
    <div
      class="p-4 rounded-xl"
      :style="{
        backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))',
      }"
    >
      <div class="flex items-center gap-3 mb-4">
        <div
          v-if="authStore.user?.avatar"
          class="w-12 h-12 rounded-full bg-cover bg-center"
          :style="{ backgroundImage: `url(${authStore.user.avatar})` }"
        />
        <div
          v-else
          class="w-12 h-12 rounded-full flex items-center justify-center font-medium"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            color: 'var(--tg-button-text-color, #fff)',
          }"
        >
          {{ authStore.user?.firstName?.charAt(0) || 'U' }}
        </div>
        <div>
          <p class="font-medium text-[var(--tg-text-color,#fff)]">
            {{ authStore.fullName }}
          </p>
          <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)]">
            Договор № {{ authStore.account?.contractNumber }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-center">
        <div
          class="p-3 rounded-lg"
          :style="{ backgroundColor: 'var(--tg-bg-color, rgba(0,0,0,0.2))' }"
        >
          <p class="text-lg font-semibold text-[var(--tg-text-color,#fff)]">
            {{ authStore.balanceRubles.toFixed(0) }} ₽
          </p>
          <p class="text-xs text-[var(--tg-hint-color,#8b8b8b)]">
            Баланс
          </p>
        </div>
        <div
          class="p-3 rounded-lg"
          :style="{ backgroundColor: 'var(--tg-bg-color, rgba(0,0,0,0.2))' }"
        >
          <p class="text-lg font-semibold text-[var(--tg-text-color,#fff)]">
            {{ authStore.daysRemaining }}
          </p>
          <p class="text-xs text-[var(--tg-hint-color,#8b8b8b)]">
            Дней
          </p>
        </div>
      </div>
    </div>

    <!-- Logout Button -->
    <button
      class="w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-colors"
      :style="{
        backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))',
        color: 'var(--tg-destructive-text-color, #ff3b30)',
      }"
      @click="handleLogout"
    >
      <Icon
        name="heroicons:arrow-right-on-rectangle"
        class="w-5 h-5"
      />
      <span class="font-medium">Выйти из аккаунта</span>
    </button>

    <!-- App Info -->
    <p class="text-center text-xs text-[var(--tg-hint-color,#8b8b8b)]">
      ПЖ19 — Личный кабинет v3.0
    </p>
  </div>
</template>
