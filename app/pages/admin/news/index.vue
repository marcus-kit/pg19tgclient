<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({ title: 'Управление новостями — Админ-панель' })

interface NewsItem {
  id: number
  title: string
  summary: string
  category: 'announcement' | 'protocol' | 'notification'
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  isPinned: boolean
  createdAt: string
}

const loading = ref(false)
const news = ref<NewsItem[]>([])
const statusFilter = ref<string>('all')

const fetchNews = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    if (statusFilter.value !== 'all') {
      query.set('status', statusFilter.value)
    }

    const data = await $fetch<{ news: NewsItem[] }>(`/api/admin/news?${query}`)
    news.value = data.news
  } catch (error) {
    console.error('Failed to fetch news:', error)
  } finally {
    loading.value = false
  }
}

const deleteNews = async (id: number) => {
  if (!confirm('Удалить эту новость?')) return

  try {
    await $fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    await fetchNews()
  } catch (error) {
    console.error('Failed to delete news:', error)
    alert('Ошибка при удалении новости')
  }
}

const getCategoryLabel = (category: string) => {
  const labels = {
    announcement: 'Объявление',
    protocol: 'Протокол',
    notification: 'Уведомление'
  }
  return labels[category as keyof typeof labels] || category
}

const getStatusColor = (status: string) => {
  const colors = {
    draft: 'bg-gray-500/20 text-gray-400',
    published: 'bg-green-500/20 text-green-400',
    archived: 'bg-orange-500/20 text-orange-400'
  }
  return colors[status as keyof typeof colors] || ''
}

const getStatusLabel = (status: string) => {
  const labels = {
    draft: 'Черновик',
    published: 'Опубликовано',
    archived: 'Архив'
  }
  return labels[status as keyof typeof labels] || status
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchNews()
})

watch(statusFilter, () => {
  fetchNews()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Управление новостями
      </h1>
      <UButton @click="$router.push('/admin/news/create')">
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Создать новость
      </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <UButton
        variant="ghost"
        :class="{ 'bg-primary/20': statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        Все
      </UButton>
      <UButton
        variant="ghost"
        :class="{ 'bg-primary/20': statusFilter === 'published' }"
        @click="statusFilter = 'published'"
      >
        Опубликованные
      </UButton>
      <UButton
        variant="ghost"
        :class="{ 'bg-primary/20': statusFilter === 'draft' }"
        @click="statusFilter = 'draft'"
      >
        Черновики
      </UButton>
      <UButton
        variant="ghost"
        :class="{ 'bg-primary/20': statusFilter === 'archived' }"
        @click="statusFilter = 'archived'"
      >
        Архив
      </UButton>
    </div>

    <!-- News List -->
    <div v-if="loading" class="text-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto" />
    </div>

    <div v-else class="space-y-4">
      <UCard
        v-for="item in news"
        :key="item.id"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <UBadge :class="getStatusColor(item.status)">
                {{ getStatusLabel(item.status) }}
              </UBadge>
              <UBadge class="bg-secondary/20 text-secondary">
                {{ getCategoryLabel(item.category) }}
              </UBadge>
              <Icon
                v-if="item.isPinned"
                name="heroicons:bookmark-solid"
                class="w-4 h-4 text-primary"
                title="Закреплено"
              />
            </div>

            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {{ item.title }}
            </h3>

            <p v-if="item.summary" class="text-sm text-[var(--text-muted)] mb-3">
              {{ item.summary }}
            </p>

            <div class="text-xs text-[var(--text-muted)]">
              Создано: {{ formatDate(item.createdAt) }}
              <span v-if="item.publishedAt">
                • Опубликовано: {{ formatDate(item.publishedAt) }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              variant="ghost"
              size="sm"
              @click="$router.push(`/admin/news/${item.id}/edit`)"
              title="Редактировать"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4" />
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              @click="deleteNews(item.id)"
              title="Удалить"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Empty state -->
      <div v-if="news.length === 0" class="text-center py-12">
        <Icon name="heroicons:newspaper" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">
          {{ statusFilter === 'all' ? 'Новостей пока нет' : `Нет новостей со статусом "${getStatusLabel(statusFilter)}"` }}
        </p>
      </div>
    </div>
  </div>
</template>
