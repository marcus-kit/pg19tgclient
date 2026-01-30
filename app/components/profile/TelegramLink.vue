<script setup lang="ts">
/**
 * TelegramLink - TWA версия
 * В Telegram Web App Telegram всегда привязан (мы знаем telegram_id из initData)
 */
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const telegramUsername = computed(() => authStore.user?.telegram || '')
const telegramId = computed(() => authStore.user?.telegramId || '')
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">
        Telegram
      </h2>
      <UBadge
        variant="success"
        size="sm"
      >
        <Icon
          name="heroicons:check"
          class="w-3 h-3 mr-1"
        />
        Привязан
      </UBadge>
    </div>

    <div class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-[#0088cc]/10">
        <Icon
          name="simple-icons:telegram"
          class="w-8 h-8 text-[#0088cc]"
        />
      </div>
      <div>
        <p class="text-[var(--text-primary)] font-medium">
          {{ telegramUsername ? `@${telegramUsername}` : 'Привязан' }}
        </p>
        <p class="text-sm text-[var(--text-muted)]">
          Вы используете Telegram Web App
        </p>
      </div>
    </div>

    <!-- TWA Info -->
    <div
      class="mt-4 p-4 rounded-lg space-y-2"
      style="background: var(--glass-bg);"
    >
      <p class="text-sm font-medium text-[var(--text-primary)]">
        Возможности:
      </p>
      <ul class="text-sm text-[var(--text-muted)] space-y-1">
        <li class="flex items-center gap-2">
          <Icon
            name="heroicons:bolt"
            class="w-4 h-4 text-primary"
          />
          Мгновенный доступ из Telegram
        </li>
        <li class="flex items-center gap-2">
          <Icon
            name="heroicons:bell"
            class="w-4 h-4 text-primary"
          />
          Уведомления через бота
        </li>
        <li class="flex items-center gap-2">
          <Icon
            name="heroicons:device-phone-mobile"
            class="w-4 h-4 text-primary"
          />
          Нативный интерфейс
        </li>
      </ul>
    </div>
  </UCard>
</template>
