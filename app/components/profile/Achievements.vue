<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const unlockedCount = computed(() =>
  authStore.achievements.filter(a => a.unlockedAt).length
)

const totalCount = computed(() => authStore.achievements.length)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getProgressPercent = (achievement: { progress?: number; maxProgress?: number }) => {
  if (!achievement.progress || !achievement.maxProgress) return 0
  return Math.round((achievement.progress / achievement.maxProgress) * 100)
}
</script>

<template>
  <UCard class="lg:col-span-2">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-semibold text-white">Достижения</h2>
        <p class="text-sm text-gray-400 mt-1">
          Получено {{ unlockedCount }} из {{ totalCount }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            :style="{ width: `${(unlockedCount / totalCount) * 100}%` }"
          />
        </div>
        <span class="text-sm text-gray-400">{{ Math.round((unlockedCount / totalCount) * 100) }}%</span>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="achievement in authStore.achievements"
        :key="achievement.id"
        :class="[
          'relative p-4 rounded-xl border transition-all',
          achievement.unlockedAt
            ? 'bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/30'
            : 'bg-white/5 border-white/10 opacity-60'
        ]"
      >
        <!-- Unlocked badge -->
        <div
          v-if="achievement.unlockedAt"
          class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
        >
          <Icon name="heroicons:check" class="w-4 h-4 text-white" />
        </div>

        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div :class="[
            'p-3 rounded-xl',
            achievement.unlockedAt
              ? 'bg-gradient-to-br from-primary to-secondary'
              : 'bg-white/10'
          ]">
            <Icon
              :name="achievement.icon"
              :class="['w-6 h-6', achievement.unlockedAt ? 'text-white' : 'text-gray-500']"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p :class="['font-medium truncate', achievement.unlockedAt ? 'text-white' : 'text-gray-400']">
              {{ achievement.title }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ achievement.description }}
            </p>

            <!-- Progress bar for incomplete achievements -->
            <div v-if="!achievement.unlockedAt && achievement.progress !== undefined" class="mt-2">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Прогресс</span>
                <span>{{ achievement.progress }}/{{ achievement.maxProgress }}</span>
              </div>
              <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all"
                  :style="{ width: `${getProgressPercent(achievement)}%` }"
                />
              </div>
            </div>

            <!-- Unlocked date -->
            <p v-if="achievement.unlockedAt" class="text-xs text-accent mt-2">
              {{ formatDate(achievement.unlockedAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
