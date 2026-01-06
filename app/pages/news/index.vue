<script setup lang="ts">
useHead({
  title: 'Новости — ПЖ19'
})

interface NewsItem {
  id: number
  title: string
  summary: string
  content: string
  category: string
  publishedAt: string
  attachments?: any[]
}

const loading = ref(true)
const news = ref<NewsItem[]>([])
const selectedNews = ref<NewsItem | null>(null)
const modalOpen = ref(false)

const fetchNews = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ news: NewsItem[] }>('/api/news')
    news.value = data.news
  } catch (error) {
    console.error('Failed to fetch news:', error)
  } finally {
    loading.value = false
  }
}

const openNews = async (id: number) => {
  try {
    const data = await $fetch<{ news: NewsItem }>(`/api/news/${id}`)
    selectedNews.value = data.news
    modalOpen.value = true
  } catch (error) {
    console.error('Failed to fetch news details:', error)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getCategoryLabel = (category: string) => {
  const labels = {
    announcement: 'Объявление',
    protocol: 'Протокол',
    notification: 'Уведомление'
  }
  return labels[category as keyof typeof labels] || category
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-secondary/20 -top-32 -left-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:newspaper" class="w-10 h-10 text-secondary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            <span class="text-gradient-secondary">Новости</span> сообщества
          </h1>
          <p class="text-xl text-[var(--text-muted)] opacity-0 animate-fade-in-up stagger-2">
            Актуальная информация о развитии ПЖ19
          </p>
        </div>
      </div>
    </section>

    <!-- News list -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto space-y-6">
          <!-- Loading state -->
          <div v-if="loading" class="text-center py-12">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>

          <!-- News items -->
          <article
            v-for="(item, index) in news"
            v-else
            :key="item.id"
            class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up cursor-pointer hover:shadow-lg transition-shadow"
            :class="`stagger-${index + 1}`"
            @click="openNews(item.id)"
          >
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 bg-secondary/20 text-secondary text-sm font-medium rounded-full">
                {{ getCategoryLabel(item.category) }}
              </span>
              <span class="text-sm text-[var(--text-muted)]">
                {{ formatDate(item.publishedAt) }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-[var(--text-primary)] mb-3">
              {{ item.title }}
            </h2>
            <p class="text-[var(--text-muted)]">
              {{ item.summary }}
            </p>
          </article>

          <!-- Empty state -->
          <div v-if="!loading && news.length === 0" class="max-w-2xl mx-auto text-center py-12">
            <div class="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Icon name="heroicons:newspaper" class="w-12 h-12 text-[var(--text-muted)]" />
            </div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-4">Новостей пока нет</h2>
            <p class="text-[var(--text-muted)]">
              Следите за обновлениями — скоро здесь появятся новости сообщества
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <NewsModal v-model:open="modalOpen" :news="selectedNews" />
  </div>
</template>
