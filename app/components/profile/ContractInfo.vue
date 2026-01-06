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
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">Договор</h2>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between py-3" style="border-bottom: 1px solid var(--glass-border);">
        <span class="text-[var(--text-muted)]">Номер договора</span>
        <span class="text-[var(--text-primary)] font-medium">{{ authStore.account?.contractNumber }}</span>
      </div>
      <div class="flex items-center justify-between py-3" style="border-bottom: 1px solid var(--glass-border);">
        <span class="text-[var(--text-muted)]">Статус</span>
        <UBadge :variant="authStore.isBlocked ? 'danger' : 'success'">
          {{ authStore.isBlocked ? 'Приостановлен' : 'Активен' }}
        </UBadge>
      </div>
      <div class="flex items-center justify-between py-3" style="border-bottom: 1px solid var(--glass-border);">
        <span class="text-[var(--text-muted)]">Тариф</span>
        <span class="text-[var(--text-primary)]">{{ authStore.account?.tariff }}</span>
      </div>
      <div class="flex items-center justify-between py-3">
        <span class="text-[var(--text-muted)]">Дата заключения</span>
        <span class="text-[var(--text-primary)]">{{ formatDate(authStore.account?.startDate || '') }}</span>
      </div>
    </div>
  </UCard>
</template>
