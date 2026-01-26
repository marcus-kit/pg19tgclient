<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Расчёт следующей даты оплаты (конец текущего месяца)
const nextPaymentDate = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  })
})

// Статус аккаунта
const statusConfig = computed(() => {
  if (authStore.isBlocked) {
    return {
      text: 'Заблокирован',
      color: 'bg-red-500',
      icon: 'heroicons:x-circle',
      iconColor: 'text-red-400'
    }
  }
  return {
    text: 'Активен',
    color: 'bg-accent',
    icon: 'heroicons:check-circle',
    iconColor: 'text-accent'
  }
})
</script>

<template>
  <UCard hover>
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-sm text-[var(--text-muted)] mb-1">Статус услуги</p>
        <div class="flex items-center gap-3 mt-2">
          <span class="relative flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              :class="statusConfig.color"
            ></span>
            <span
              class="relative inline-flex rounded-full h-3 w-3"
              :class="statusConfig.color"
            ></span>
          </span>
          <span class="text-xl font-semibold text-[var(--text-primary)]">
            {{ statusConfig.text }}
          </span>
        </div>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="authStore.isBlocked ? 'bg-red-500/20' : 'bg-accent/20'"
      >
        <Icon :name="statusConfig.icon" class="w-6 h-6" :class="statusConfig.iconColor" />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-[var(--text-muted)]">
        <Icon name="heroicons:calendar" class="w-4 h-4" />
        <span class="text-sm">
          Следующая оплата: <span class="text-[var(--text-primary)] font-medium">{{ nextPaymentDate }}</span>
        </span>
      </div>
      <NuxtLink to="/invoices">
        <UButton size="sm" variant="secondary">
          Оплатить сейчас
        </UButton>
      </NuxtLink>
    </div>
  </UCard>
</template>
