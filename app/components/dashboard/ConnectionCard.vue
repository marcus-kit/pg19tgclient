<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <UCard hover>
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-sm text-gray-400 mb-1">Подключение</p>
        <p class="text-lg font-semibold text-white">{{ authStore.account?.tariff }}</p>
      </div>
      <div class="p-3 rounded-xl bg-accent/20">
        <Icon name="heroicons:wifi" class="w-6 h-6 text-accent" />
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 rounded-full" :class="authStore.isBlocked ? 'bg-red-500' : 'bg-accent animate-pulse'" />
        <span class="text-sm text-gray-300">
          {{ authStore.isBlocked ? 'Услуга приостановлена' : 'Услуга активна' }}
        </span>
      </div>

      <div class="flex items-center gap-3 text-sm text-gray-400">
        <Icon name="heroicons:map-pin" class="w-4 h-4" />
        <span class="line-clamp-1">{{ authStore.account?.address }}</span>
      </div>
    </div>
  </UCard>
</template>
