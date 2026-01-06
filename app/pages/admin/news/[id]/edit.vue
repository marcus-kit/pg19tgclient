<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({ title: 'Редактировать новость — Админ-панель' })

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const newsId = computed(() => route.params.id as string)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: 'announcement' as 'announcement' | 'protocol' | 'notification',
  status: 'draft' as 'draft' | 'published' | 'archived',
  isPinned: false
})

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const attachments = ref<any[]>([])

const categoryOptions = [
  { label: 'Объявление', value: 'announcement' },
  { label: 'Протокол', value: 'protocol' },
  { label: 'Уведомление', value: 'notification' }
]

const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Опубликовать', value: 'published' },
  { label: 'Архив', value: 'archived' }
]

// Загрузка данных новости
const fetchNews = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch<{ news: any }>(`/api/admin/news/${newsId.value}`)
    const news = data.news

    // Заполняем форму
    form.title = news.title
    form.summary = news.summary || ''
    form.content = news.content
    form.category = news.category
    form.status = news.status
    form.isPinned = news.isPinned

    // Сохраняем вложения
    attachments.value = news.attachments || []
  } catch (err: any) {
    console.error('Failed to fetch news:', err)
    error.value = err.data?.message || 'Ошибка при загрузке новости'
  } finally {
    loading.value = false
  }
}

const saveNews = async () => {
  // Валидация
  if (!form.title.trim()) {
    error.value = 'Введите заголовок'
    return
  }

  if (!form.content.trim() || form.content === '<p></p>') {
    error.value = 'Введите контент новости'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/admin/news/${newsId.value}`, {
      method: 'PUT',
      body: {
        title: form.title,
        summary: form.summary || null,
        content: form.content,
        category: form.category,
        status: form.status,
        isPinned: form.isPinned
      }
    })

    // Успех — переход к списку
    router.push('/admin/news')
  } catch (err: any) {
    console.error('Failed to update news:', err)
    error.value = err.data?.message || 'Ошибка при обновлении новости'
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/admin/news')
}

// Загружаем данные при монтировании
onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Редактировать новость
      </h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error -->
    <div v-else-if="error && !loading" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {{ error }}
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="saveNews" class="space-y-6">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Заголовок *
        </label>
        <UInput
          v-model="form.title"
          placeholder="Введите заголовок новости"
          size="lg"
        />
      </div>

      <!-- Summary -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Краткое описание
        </label>
        <UInput
          v-model="form.summary"
          placeholder="Краткое описание (опционально)"
        />
      </div>

      <!-- Category & Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Категория
          </label>
          <div class="relative">
            <select
              v-model="form.category"
              class="custom-select w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer bg-[var(--glass-bg)] hover:border-primary/50"
            >
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Icon name="heroicons:chevron-down" class="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Статус
          </label>
          <div class="relative">
            <select
              v-model="form.status"
              class="custom-select w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer bg-[var(--glass-bg)] hover:border-primary/50"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Icon name="heroicons:chevron-down" class="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
          </div>
        </div>
      </div>

      <!-- Pin -->
      <div class="flex items-center gap-3">
        <input
          v-model="form.isPinned"
          type="checkbox"
          id="isPinned"
          class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="isPinned" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          Закрепить новость
        </label>
      </div>

      <!-- Content Editor -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Контент *
        </label>
        <AdminNewsEditor v-model="form.content" />
      </div>

      <!-- Existing Attachments -->
      <div v-if="attachments.length > 0" class="glass-card rounded-lg p-4">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">
          Прикрепленные файлы
        </h3>
        <div class="space-y-2">
          <div
            v-for="att in attachments"
            :key="att.id"
            class="flex items-center gap-3 p-2 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)]"
          >
            <Icon name="heroicons:document" class="w-5 h-5 text-primary" />
            <span class="flex-1 text-sm text-[var(--text-secondary)]">
              {{ att.fileName }}
            </span>
            <a
              :href="att.filePath"
              target="_blank"
              download
              class="text-xs text-primary hover:text-secondary transition-colors"
            >
              Скачать
            </a>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <UButton
          type="submit"
          :loading="saving"
          :disabled="saving"
        >
          Сохранить изменения
        </UButton>
        <UButton
          variant="ghost"
          @click="cancel"
          :disabled="saving"
        >
          Отмена
        </UButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.custom-select option {
  background-color: var(--glass-bg);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
}

.custom-select option:checked {
  background: linear-gradient(to right, rgba(247, 148, 29, 0.2), rgba(233, 30, 140, 0.1));
  color: var(--text-primary);
  font-weight: 600;
}

.custom-select option:hover {
  background-color: var(--glass-border);
}
</style>
