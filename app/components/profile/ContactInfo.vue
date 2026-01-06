<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const contacts = computed(() => [
  {
    label: 'Телефон',
    value: authStore.user?.phone,
    icon: 'heroicons:phone',
    verified: true
  },
  {
    label: 'Email',
    value: authStore.user?.email,
    icon: 'heroicons:envelope',
    verified: true
  },
  {
    label: 'Telegram',
    value: authStore.user?.telegram,
    icon: 'simple-icons:telegram',
    verified: false
  },
  {
    label: 'VK ID',
    value: authStore.user?.vkId,
    icon: 'simple-icons:vk',
    verified: false
  }
])
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-white">Контакты</h2>
      <button class="text-sm text-primary hover:text-primary/80 transition-colors">
        Редактировать
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="contact in contacts"
        :key="contact.label"
        class="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-white/5">
            <Icon :name="contact.icon" class="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500">{{ contact.label }}</p>
            <p class="text-white">{{ contact.value || '—' }}</p>
          </div>
        </div>
        <UBadge v-if="contact.value && contact.verified" variant="success" size="sm">
          Подтверждён
        </UBadge>
        <UBadge v-else-if="contact.value" variant="neutral" size="sm">
          Не подтверждён
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
