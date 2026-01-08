<script setup lang="ts">
interface Attachment {
  id: number
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
}

interface NewsItem {
  id: number
  title: string
  content: string
  category: string
  publishedAt: string
  attachments?: Attachment[]
}

const props = defineProps<{
  news: NewsItem | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const close = () => {
  emit('update:open', false)
}

const getCategoryLabel = (category: string) => {
  const labels = {
    announcement: 'Объявление',
    protocol: 'Протокол',
    notification: 'Уведомление'
  }
  return labels[category as keyof typeof labels] || category
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && news"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6 md:p-8">
          <!-- Close button -->
          <button
            @click="close"
            class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--glass-bg)] transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6 text-[var(--text-secondary)]" />
          </button>

          <!-- Header -->
          <div class="mb-6 pr-10">
            <UBadge class="bg-secondary/20 text-secondary mb-3">
              {{ getCategoryLabel(news.category) }}
            </UBadge>

            <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
              {{ news.title }}
            </h2>

            <p class="text-sm text-[var(--text-muted)]">
              {{ new Date(news.publishedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) }}
            </p>
          </div>

          <!-- Content -->
          <div
            class="prose prose-invert max-w-none text-[var(--text-secondary)] mb-6"
            v-html="news.content"
          ></div>

          <!-- Attachments -->
          <div v-if="news.attachments && news.attachments.length > 0" class="pt-6 border-t border-[var(--glass-border)]">
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Вложения</h3>

            <div class="space-y-2">
              <a
                v-for="att in news.attachments"
                :key="att.id"
                :href="att.filePath"
                target="_blank"
                download
                class="flex items-center gap-3 px-4 py-3 glass-card rounded-lg hover:bg-[var(--glass-bg)] transition-colors group"
              >
                <Icon name="heroicons:document" class="w-5 h-5 text-primary" />
                <div class="flex-1">
                  <span class="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {{ att.fileName }}
                  </span>
                  <span class="text-xs text-[var(--text-muted)] ml-2">
                    ({{ formatFileSize(att.fileSize) }})
                  </span>
                </div>
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)] group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .glass-card,
.modal-leave-active .glass-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .glass-card,
.modal-leave-to .glass-card {
  transform: scale(0.95);
}

/* Стили для prose (content) */
:deep(.prose) {
  font-size: 1rem;
  line-height: 1.75;
}

:deep(.prose p) {
  margin-bottom: 1rem;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  color: var(--text-primary);
}

:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
  color: var(--text-primary);
}

:deep(.prose ul),
:deep(.prose ol) {
  list-style-position: outside;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.prose ul) {
  list-style-type: disc;
}

:deep(.prose ol) {
  list-style-type: decimal;
}

:deep(.prose a) {
  color: var(--primary);
  text-decoration: underline;
}

:deep(.prose a:hover) {
  color: var(--secondary);
}

:deep(.prose strong) {
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.prose em) {
  font-style: italic;
}
</style>
