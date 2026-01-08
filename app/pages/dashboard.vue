<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { NewsCategory } from '~/types/news'

definePageMeta({
  layout: 'twa'
})

const authStore = useAuthStore()

// Загрузка новостей из API
const { fetchNews } = useNews()
const { news, pending, error } = await fetchNews({ limit: 3, active: true })

// Модальное окно
const selectedNewsId = ref<number | null>(null)

const openNewsModal = (id: number) => {
  selectedNewsId.value = id
}

const closeNewsModal = () => {
  selectedNewsId.value = null
}

// Форматирование даты (короткий формат)
const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Маппинг категорий
const categoryLabels: Record<NewsCategory, string> = {
  announcement: 'Объявление',
  protocol: 'Протокол',
  notification: 'Уведомление'
}

const categoryVariants: Record<NewsCategory, 'warning' | 'info' | 'success'> = {
  announcement: 'warning',
  protocol: 'info',
  notification: 'success'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        Добро пожаловать, {{ authStore.user?.firstName }}!
      </h1>
      <p class="text-[var(--text-muted)] mt-1">Договор № {{ authStore.account?.contractNumber }}</p>
    </div>

    <!-- Main Grid -->
    <div class="grid md:grid-cols-2 gap-4">
      <DashboardBalanceCard />
      <DashboardConnectionCard />
    </div>

    <!-- Special Offer -->
    <section>
      <UCard class="p-0 overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/5">
        <div class="p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div class="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name="heroicons:gift" class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                Специальное предложение
              </span>
            </div>
            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-1">
              ТВ Расширенный — месяц бесплатно
            </h3>
            <p class="text-[var(--text-muted)] text-sm">
              191 канал + кинозалы. Подключите сейчас и смотрите бесплатно до 28 февраля!
            </p>
          </div>
          <div class="flex-shrink-0">
            <UButton variant="primary">
              Подключить
            </UButton>
          </div>
        </div>
      </UCard>
    </section>

    <!-- Community News -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">Новости сообщества</h2>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="grid md:grid-cols-3 gap-4">
        <UCard v-for="i in 3" :key="i" class="p-5 animate-pulse">
          <div class="h-3 bg-white/10 rounded w-20 mb-2" />
          <div class="h-5 bg-white/10 rounded w-full mb-2" />
          <div class="h-4 bg-white/10 rounded w-full" />
        </UCard>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p class="text-red-400 text-center">Не удалось загрузить новости</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="news.length === 0" class="p-8 text-center bg-white/5 rounded-lg">
        <Icon name="heroicons:newspaper" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" />
        <p class="text-[var(--text-muted)]">Новостей пока нет</p>
      </div>

      <!-- News Grid -->
      <div v-else class="grid md:grid-cols-3 gap-4">
        <UCard
          v-for="item in news"
          :key="item.id"
          hover
          class="p-5 cursor-pointer transition-transform hover:scale-[1.02]"
          @click="openNewsModal(item.id)"
        >
          <div class="flex items-center gap-2 mb-2">
            <p class="text-xs text-[var(--text-muted)]">
              {{ formatShortDate(item.publishedAt) }}
            </p>
            <UBadge :variant="categoryVariants[item.category]" size="sm">
              {{ categoryLabels[item.category] }}
            </UBadge>
            <Icon v-if="item.isPinned" name="heroicons:star-solid" class="w-3 h-3 text-primary ml-auto" />
          </div>
          <h3 class="font-medium text-[var(--text-primary)] mb-2">{{ item.title }}</h3>
          <p class="text-sm text-[var(--text-secondary)] line-clamp-2">
            {{ item.summary || item.content.substring(0, 100) + '...' }}
          </p>
        </UCard>
      </div>

      <!-- Modal -->
      <DashboardNewsModal
        v-if="selectedNewsId"
        :news-id="selectedNewsId"
        @close="closeNewsModal"
      />
    </section>
  </div>
</template>
