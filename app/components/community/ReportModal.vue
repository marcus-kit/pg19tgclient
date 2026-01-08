<script setup lang="ts">
import type { CommunityReportReason } from '~/types/community'

interface Props {
  messageId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  report: [{ messageId: number; reason: CommunityReportReason; details: string }]
}>()

const isSubmitting = ref(false)
const selectedReason = ref<CommunityReportReason | null>(null)
const details = ref('')
const error = ref('')

const reasons: { value: CommunityReportReason; label: string; icon: string }[] = [
  { value: 'spam', label: 'Спам', icon: 'heroicons:envelope' },
  { value: 'abuse', label: 'Оскорбления', icon: 'heroicons:exclamation-triangle' },
  { value: 'fraud', label: 'Мошенничество', icon: 'heroicons:shield-exclamation' },
  { value: 'other', label: 'Другое', icon: 'heroicons:question-mark-circle' }
]

const handleSubmit = async () => {
  if (!selectedReason.value) {
    error.value = 'Выберите причину жалобы'
    return
  }

  isSubmitting.value = true
  error.value = ''

  emit('report', {
    messageId: props.messageId,
    reason: selectedReason.value,
    details: details.value.trim()
  })
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') emit('close')
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background-color: var(--modal-backdrop);"
      @click="handleBackdropClick"
    >
      <div
        class="w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style="background-color: var(--bg-surface); border: 1px solid var(--glass-border);"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">
            Пожаловаться
          </h3>
          <button
            @click="emit('close')"
            class="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Description -->
        <p class="text-sm text-[var(--text-muted)] mb-4">
          Выберите причину жалобы. Модераторы рассмотрят её в ближайшее время.
        </p>

        <!-- Reason selection -->
        <div class="mb-4 space-y-2">
          <button
            v-for="r in reasons"
            :key="r.value"
            @click="selectedReason = r.value"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left"
            :class="selectedReason === r.value
              ? 'bg-primary/20 border-primary'
              : 'border-[var(--glass-border)] hover:bg-white/5'"
          >
            <Icon
              :name="r.icon"
              class="w-5 h-5"
              :class="selectedReason === r.value ? 'text-primary' : 'text-[var(--text-muted)]'"
            />
            <span
              class="text-sm"
              :class="selectedReason === r.value ? 'text-primary' : 'text-[var(--text-primary)]'"
            >
              {{ r.label }}
            </span>
          </button>
        </div>

        <!-- Details (optional) -->
        <div class="mb-4">
          <label class="text-xs text-[var(--text-muted)] mb-2 block">Детали (необязательно)</label>
          <textarea
            v-model="details"
            rows="2"
            maxlength="500"
            class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Опишите проблему подробнее..."
          />
        </div>

        <!-- Error -->
        <p v-if="error" class="text-xs text-red-400 mb-4">{{ error }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <button
            @click="emit('close')"
            class="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-white/5 transition-colors"
            :disabled="isSubmitting"
          >
            Отмена
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 px-4 py-2 text-sm rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
            :disabled="isSubmitting || !selectedReason"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:flag" class="w-4 h-4" />
            Отправить
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
