<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-white">Адрес подключения</h2>
    </div>

    <div class="flex items-start gap-4">
      <div class="p-3 rounded-xl bg-info/20">
        <Icon name="heroicons:map-pin" class="w-6 h-6 text-blue-400" />
      </div>
      <div>
        <p class="text-white">{{ authStore.account?.address }}</p>
        <p class="text-sm text-gray-500 mt-1">Адрес предоставления услуг</p>
      </div>
    </div>
  </UCard>
</template>
