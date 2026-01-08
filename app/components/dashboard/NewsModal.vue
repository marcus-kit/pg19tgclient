<script setup lang="ts">
import type { NewsCategory } from '~/types/news'

interface Props {
  newsId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { fetchNewsById } = useNews()

// Загрузка новости при изменении ID
const { news, pending, error } = await fetchNewsById(props.newsId!)

// Маппинг категорий для отображения
const categoryLabels: Record<NewsCategory, string> = {
  announcement: 'Объявление',
  protocol: 'Протокол',
  notification: 'Уведомление'
}

const categoryVariants: Record<NewsCategory, 'warning' | 'info' | 'success'> = {
  announcement: 'warning',  // Оранжевый (brand color)
  protocol: 'info',         // Синий
  notification: 'success'   // Зелёный (accent)
}

// Форматирование даты
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Форматирование размера файла
const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Неизвестно'
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

// Закрытие по ESC
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  // Блокировка прокрутки body
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  /* Размытый backdrop снаружи контента */
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

/* Светлая тема */
:root:not(.dark) .modal-content {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
}
</style>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <!-- Modal -->
      <div
        class="modal-content bg-[var(--bg-surface)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--glass-border)] shadow-2xl"
        @click.stop
      >
        <!-- Loading State -->
        <div v-if="pending" class="p-8 text-center">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-[var(--text-muted)]">Загрузка новости...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center">
          <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p class="text-red-400 mb-4">Ошибка при загрузке новости</p>
          <UButton @click="emit('close')" variant="secondary">Закрыть</UButton>
        </div>

        <!-- Content -->
        <div v-else-if="news" class="p-8">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-3">
                <UBadge :variant="categoryVariants[news.category]" size="sm">
                  {{ categoryLabels[news.category] }}
                </UBadge>
                <UBadge v-if="news.isPinned" variant="warning" size="sm">
                  <Icon name="heroicons:star-solid" class="w-3 h-3 mr-1" />
                  Закреплено
                </UBadge>
              </div>
              <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {{ news.title }}
              </h2>
              <p class="text-sm text-[var(--text-muted)]">
                {{ formatDate(news.publishedAt) }}
              </p>
            </div>
            <button
              @click="emit('close')"
              class="ml-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6 text-[var(--text-muted)]" />
            </button>
          </div>

          <!-- Summary (если есть) -->
          <div v-if="news.summary" class="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p class="text-[var(--text-secondary)] font-medium">{{ news.summary }}</p>
          </div>

          <!-- Content -->
          <div class="prose dark:prose-invert max-w-none mb-6">
            <div class="text-[var(--text-secondary)] whitespace-pre-wrap" v-html="news.content" />
          </div>

          <!-- Attachments -->
          <div v-if="news.attachments && news.attachments.length > 0" class="mt-6">
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Вложения
            </h3>
            <div class="space-y-2">
              <a
                v-for="attachment in news.attachments"
                :key="attachment.id"
                :href="attachment.filePath"
                target="_blank"
                class="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-bg)] hover:bg-primary/10 transition-colors group"
              >
                <Icon name="heroicons:document" class="w-5 h-5 text-primary" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-primary transition-colors">
                    {{ attachment.fileName }}
                  </p>
                  <p class="text-xs text-[var(--text-muted)]">
                    {{ formatFileSize(attachment.fileSize) }}
                  </p>
                </div>
                <Icon name="heroicons:arrow-down-tray" class="w-5 h-5 text-[var(--text-muted)] group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="mt-8 pt-6 border-t border-[var(--glass-border)] flex justify-end">
            <UButton @click="emit('close')" variant="secondary">
              Закрыть
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
