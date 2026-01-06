<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

const authStore = useAuthStore()

// Profile completion calculation
const profileFields = computed(() => [
  { name: 'Фото', filled: !!authStore.user?.avatar, points: 10 },
  { name: 'Имя', filled: !!authStore.user?.firstName, points: 10 },
  { name: 'Фамилия', filled: !!authStore.user?.lastName, points: 10 },
  { name: 'Отчество', filled: !!authStore.user?.middleName, points: 5 },
  { name: 'Дата рождения', filled: !!authStore.user?.birthDate, points: 10 },
  { name: 'Телефон', filled: !!authStore.user?.phone, points: 15 },
  { name: 'Email', filled: !!authStore.user?.email, points: 15 },
  { name: 'Telegram', filled: !!authStore.user?.telegram, points: 10 },
  { name: 'VK ID', filled: !!authStore.user?.vkId, points: 15 }
])

const completedPoints = computed(() =>
  profileFields.value.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0)
)

const totalPoints = computed(() =>
  profileFields.value.reduce((sum, f) => sum + f.points, 0)
)

const completionPercent = computed(() =>
  Math.round((completedPoints.value / totalPoints.value) * 100)
)

const missingFields = computed(() =>
  profileFields.value.filter(f => !f.filled)
)

const levelInfo = computed(() => {
  const percent = completionPercent.value
  if (percent >= 100) return { level: 'Мастер', color: 'from-yellow-400 to-amber-500', icon: 'heroicons:star' }
  if (percent >= 80) return { level: 'Эксперт', color: 'from-purple-400 to-purple-600', icon: 'heroicons:academic-cap' }
  if (percent >= 50) return { level: 'Продвинутый', color: 'from-blue-400 to-blue-600', icon: 'heroicons:arrow-trending-up' }
  return { level: 'Новичок', color: 'from-gray-400 to-gray-600', icon: 'heroicons:user' }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Профиль</h1>
      <p class="text-gray-400 mt-1">Управление личными данными</p>
    </div>

    <!-- Profile Completion Card -->
    <UCard class="p-0 overflow-hidden">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', levelInfo.color]">
              <Icon :name="levelInfo.icon" class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm text-gray-400">Ваш уровень</p>
              <p class="text-lg font-bold text-white">{{ levelInfo.level }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-white">{{ completionPercent }}%</p>
            <p class="text-sm text-gray-400">заполнено</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="relative h-3 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            :style="{ width: `${completionPercent}%` }"
          />
        </div>

        <!-- Missing Fields -->
        <div v-if="missingFields.length > 0" class="flex flex-wrap gap-2">
          <span class="text-sm text-gray-400">Заполните:</span>
          <span
            v-for="field in missingFields"
            :key="field.name"
            class="px-2 py-1 text-xs rounded-full bg-white/5 text-gray-300 hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors"
          >
            {{ field.name }} <span class="text-primary">+{{ field.points }}</span>
          </span>
        </div>
        <div v-else class="flex items-center gap-2 text-accent">
          <Icon name="heroicons:check-circle" class="w-5 h-5" />
          <span class="text-sm font-medium">Профиль заполнен полностью!</span>
        </div>
      </div>
    </UCard>

    <!-- Avatar & Personal Info -->
    <div class="grid lg:grid-cols-3 gap-6">
      <ProfileAvatar />
      <div class="lg:col-span-2">
        <ProfilePersonalInfo />
      </div>
    </div>

    <!-- Achievements -->
    <ProfileAchievements />

    <!-- Referral Program -->
    <ProfileReferral />

    <!-- Contact & Notifications -->
    <div class="grid lg:grid-cols-2 gap-6">
      <ProfileContactInfo />
      <ProfileNotifications />
    </div>

    <!-- Security & Address -->
    <div class="grid lg:grid-cols-2 gap-6">
      <ProfileSecurity />
      <ProfileAddressInfo />
    </div>

    <!-- Contract Info -->
    <ProfileContractInfo />
  </div>
</template>
