<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const formattedBirthDate = computed(() => {
  if (!authStore.user?.birthDate) return null
  return new Date(authStore.user.birthDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const age = computed(() => {
  if (!authStore.user?.birthDate) return null
  const birthDate = new Date(authStore.user.birthDate)
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years--
  }
  return years
})

const ageLabel = computed(() => {
  if (!age.value) return ''
  const lastDigit = age.value % 10
  const lastTwoDigits = age.value % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет'
  if (lastDigit === 1) return 'год'
  if (lastDigit >= 2 && lastDigit <= 4) return 'года'
  return 'лет'
})
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-white">Персональные данные</h2>
      <button class="text-sm text-primary hover:text-primary/80 transition-colors">
        Редактировать
      </button>
    </div>

    <div class="space-y-4">
      <div class="grid gap-4">
        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-white/5">
              <Icon name="heroicons:user" class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Фамилия</p>
              <p class="text-white">{{ authStore.user?.lastName }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-white/5">
              <Icon name="heroicons:user" class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Имя</p>
              <p class="text-white">{{ authStore.user?.firstName }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-white/5">
              <Icon name="heroicons:user" class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Отчество</p>
              <p class="text-white">{{ authStore.user?.middleName || '—' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-white/5">
              <Icon name="heroicons:cake" class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Дата рождения</p>
              <p class="text-white">
                <template v-if="formattedBirthDate">
                  {{ formattedBirthDate }}
                  <span class="text-gray-500 text-sm">({{ age }} {{ ageLabel }})</span>
                </template>
                <template v-else>—</template>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
