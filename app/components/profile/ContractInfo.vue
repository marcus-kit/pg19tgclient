<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-white">Договор</h2>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between py-3 border-b border-white/5">
        <span class="text-gray-400">Номер договора</span>
        <span class="text-white font-medium">{{ authStore.account?.contractNumber }}</span>
      </div>
      <div class="flex items-center justify-between py-3 border-b border-white/5">
        <span class="text-gray-400">Статус</span>
        <UBadge :variant="authStore.isBlocked ? 'danger' : 'success'">
          {{ authStore.isBlocked ? 'Приостановлен' : 'Активен' }}
        </UBadge>
      </div>
      <div class="flex items-center justify-between py-3 border-b border-white/5">
        <span class="text-gray-400">Тариф</span>
        <span class="text-white">{{ authStore.account?.tariff }}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-gray-400">Дата заключения</span>
        <span class="text-white">{{ formatDate(authStore.account?.startDate || '') }}</span>
      </div>
    </div>
  </UCard>
</template>
