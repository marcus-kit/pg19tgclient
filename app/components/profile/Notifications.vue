<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const channels = computed(() => [
  {
    key: 'email' as const,
    label: 'Email',
    description: 'Уведомления на почту',
    icon: 'heroicons:envelope',
    enabled: authStore.notifications.email
  },
  {
    key: 'sms' as const,
    label: 'SMS',
    description: 'Текстовые сообщения',
    icon: 'heroicons:device-phone-mobile',
    enabled: authStore.notifications.sms
  },
  {
    key: 'push' as const,
    label: 'Push',
    description: 'Браузерные уведомления',
    icon: 'heroicons:bell',
    enabled: authStore.notifications.push
  },
  {
    key: 'telegram' as const,
    label: 'Telegram',
    description: 'Сообщения в Telegram',
    icon: 'simple-icons:telegram',
    enabled: authStore.notifications.telegram
  }
])

const notificationTypes = computed(() => [
  {
    key: 'payments' as const,
    label: 'Оплата',
    description: 'Напоминания об оплате и чеки',
    enabled: authStore.notifications.types.payments
  },
  {
    key: 'maintenance' as const,
    label: 'Техработы',
    description: 'Плановые работы и аварии',
    enabled: authStore.notifications.types.maintenance
  },
  {
    key: 'promotions' as const,
    label: 'Акции',
    description: 'Специальные предложения и скидки',
    enabled: authStore.notifications.types.promotions
  },
  {
    key: 'news' as const,
    label: 'Новости',
    description: 'Новости компании и обновления',
    enabled: authStore.notifications.types.news
  }
])

const toggleChannel = (key: 'email' | 'sms' | 'push' | 'telegram') => {
  authStore.updateNotifications({
    [key]: !authStore.notifications[key]
  })
}

const toggleType = (key: 'payments' | 'maintenance' | 'promotions' | 'news') => {
  authStore.updateNotifications({
    types: {
      ...authStore.notifications.types,
      [key]: !authStore.notifications.types[key]
    }
  })
}
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">Уведомления</h2>
    </div>

    <!-- Channels -->
    <div class="mb-6">
      <p class="text-sm text-[var(--text-muted)] mb-3">Каналы доставки</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="channel in channels"
          :key="channel.key"
          :class="[
            'p-3 rounded-xl border transition-all text-left',
            channel.enabled
              ? 'bg-primary/10 border-primary/30 text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:border-[var(--glass-hover-border)]'
          ]"
          :style="!channel.enabled ? 'background: var(--glass-bg); border: 1px solid var(--glass-border);' : ''"
          @click="toggleChannel(channel.key)"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'p-2 rounded-xl',
              channel.enabled ? 'bg-gradient-to-br from-primary/20 to-secondary/10' : ''
            ]" :style="!channel.enabled ? 'background: var(--glass-bg);' : ''">
              <Icon
                :name="channel.icon"
                :class="['w-5 h-5', channel.enabled ? 'text-primary' : 'text-[var(--text-muted)]']"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ channel.label }}</p>
              <p class="text-xs text-[var(--text-muted)] truncate">{{ channel.description }}</p>
            </div>
            <div :class="[
              'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
              channel.enabled
                ? 'bg-primary border-primary'
                : 'border-[var(--text-muted)]'
            ]">
              <Icon
                v-if="channel.enabled"
                name="heroicons:check"
                class="w-3 h-3 text-white"
              />
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Types -->
    <div>
      <p class="text-sm text-[var(--text-muted)] mb-3">Типы уведомлений</p>
      <div class="space-y-2">
        <button
          v-for="type in notificationTypes"
          :key="type.key"
          class="w-full flex items-center justify-between p-3 rounded-xl hover:opacity-80 transition-colors"
          style="background: var(--glass-bg);"
          @click="toggleType(type.key)"
        >
          <div>
            <p class="text-[var(--text-primary)] text-sm font-medium text-left">{{ type.label }}</p>
            <p class="text-xs text-[var(--text-muted)] text-left">{{ type.description }}</p>
          </div>
          <div :class="[
            'w-10 h-6 rounded-full p-1 transition-colors',
            type.enabled ? 'bg-primary' : 'bg-[var(--glass-border)]'
          ]">
            <div :class="[
              'w-4 h-4 rounded-full bg-white transition-transform',
              type.enabled ? 'translate-x-4' : 'translate-x-0'
            ]" />
          </div>
        </button>
      </div>
    </div>
  </UCard>
</template>
