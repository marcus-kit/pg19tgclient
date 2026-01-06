<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Mock next payment date (end of current month)
const nextPaymentDate = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  })
})
</script>

<template>
  <UCard hover>
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-sm text-gray-400 mb-1">Статус услуги</p>
        <div class="flex items-center gap-3 mt-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          <span class="text-xl font-semibold text-white">
            {{ authStore.isBlocked ? 'Заблокирован' : 'Активен' }}
          </span>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-accent/20">
        <Icon name="heroicons:check-circle" class="w-6 h-6 text-accent" />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-gray-400">
        <Icon name="heroicons:calendar" class="w-4 h-4" />
        <span class="text-sm">
          Следующая оплата: <span class="text-white font-medium">{{ nextPaymentDate }}</span>
        </span>
      </div>
      <UButton size="sm" variant="secondary">
        Оплатить сейчас
      </UButton>
    </div>
  </UCard>
</template>
