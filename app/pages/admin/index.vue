<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({ title: 'Админ-панель — ПЖ19' })

const authStore = useAuthStore()

interface NewsStats {
  total: number
  published: number
  draft: number
  archived: number
}

interface RecentNews {
  id: number
  title: string
  status: string
  createdAt: string
}

const loading = ref(true)
const stats = ref<NewsStats>({
  total: 0,
  published: 0,
  draft: 0,
  archived: 0
})
const recentNews = ref<RecentNews[]>([])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    // Получаем все новости для статистики
    const allNews = await $fetch<{ news: any[] }>('/api/admin/news')

    // Подсчитываем статистику
    stats.value.total = allNews.news.length
    stats.value.published = allNews.news.filter(n => n.status === 'published').length
    stats.value.draft = allNews.news.filter(n => n.status === 'draft').length
    stats.value.archived = allNews.news.filter(n => n.status === 'archived').length

    // Берем 5 последних новостей
    recentNews.value = allNews.news.slice(0, 5).map(n => ({
      id: n.id,
      title: n.title,
      status: n.status,
      createdAt: n.createdAt
    }))
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (status: string) => {
  const labels = {
    draft: 'Черновик',
    published: 'Опубликовано',
    archived: 'Архив'
  }
  return labels[status as keyof typeof labels] || status
}

const getStatusColor = (status: string) => {
  const colors = {
    draft: 'bg-gray-500/20 text-gray-400',
    published: 'bg-green-500/20 text-green-400',
    archived: 'bg-orange-500/20 text-orange-400'
  }
  return colors[status as keyof typeof colors] || ''
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">
        Добро пожаловать, {{ authStore.user?.firstName }}!
      </h1>
      <p class="text-[var(--text-muted)]">
        Панель управления сайтом ПЖ19
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total News -->
        <UCard class="glass-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--text-muted)] mb-1">Всего новостей</p>
              <p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats.total }}</p>
            </div>
            <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Icon name="heroicons:newspaper" class="w-6 h-6 text-primary" />
            </div>
          </div>
        </UCard>

        <!-- Published -->
        <UCard class="glass-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--text-muted)] mb-1">Опубликовано</p>
              <p class="text-3xl font-bold text-green-400">{{ stats.published }}</p>
            </div>
            <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Icon name="heroicons:check-circle" class="w-6 h-6 text-green-400" />
            </div>
          </div>
        </UCard>

        <!-- Drafts -->
        <UCard class="glass-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--text-muted)] mb-1">Черновики</p>
              <p class="text-3xl font-bold text-gray-400">{{ stats.draft }}</p>
            </div>
            <div class="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
              <Icon name="heroicons:document-text" class="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </UCard>

        <!-- Archived -->
        <UCard class="glass-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--text-muted)] mb-1">В архиве</p>
              <p class="text-3xl font-bold text-orange-400">{{ stats.archived }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Icon name="heroicons:archive-box" class="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-4">Быстрые действия</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard
            class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            @click="$router.push('/admin/news/create')"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-xl flex items-center justify-center">
                <Icon name="heroicons:plus" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-[var(--text-primary)]">Создать новость</h3>
                <p class="text-sm text-[var(--text-muted)]">Опубликовать новое объявление</p>
              </div>
            </div>
          </UCard>

          <UCard
            class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            @click="$router.push('/admin/news')"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-secondary/20 to-accent/10 rounded-xl flex items-center justify-center">
                <Icon name="heroicons:list-bullet" class="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 class="font-semibold text-[var(--text-primary)]">Все новости</h3>
                <p class="text-sm text-[var(--text-muted)]">Управление новостями</p>
              </div>
            </div>
          </UCard>

          <UCard
            class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            @click="$router.push('/lk/dashboard')"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/10 rounded-xl flex items-center justify-center">
                <Icon name="heroicons:arrow-left" class="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 class="font-semibold text-[var(--text-primary)]">Личный кабинет</h3>
                <p class="text-sm text-[var(--text-muted)]">Вернуться в ЛК</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Recent News -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-[var(--text-primary)]">Последние новости</h2>
          <UButton
            variant="ghost"
            size="sm"
            @click="$router.push('/admin/news')"
          >
            Смотреть все
            <Icon name="heroicons:arrow-right" class="w-4 h-4 ml-1" />
          </UButton>
        </div>

        <div v-if="recentNews.length > 0" class="space-y-3">
          <UCard
            v-for="item in recentNews"
            :key="item.id"
            class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
            @click="$router.push(`/admin/news/${item.id}/edit`)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <UBadge :class="getStatusColor(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </UBadge>
                </div>
                <h3 class="font-semibold text-[var(--text-primary)] mb-1">
                  {{ item.title }}
                </h3>
                <p class="text-xs text-[var(--text-muted)]">
                  {{ formatDate(item.createdAt) }}
                </p>
              </div>
              <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--text-muted)]" />
            </div>
          </UCard>
        </div>

        <div v-else class="text-center py-8 glass-card rounded-lg">
          <Icon name="heroicons:inbox" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p class="text-[var(--text-muted)]">Новостей пока нет</p>
        </div>
      </div>
    </div>
  </div>
</template>
