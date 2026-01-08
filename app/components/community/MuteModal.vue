<script setup lang="ts">
interface Props {
  userId: number
  userName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  mute: [{ userId: number; duration: number; reason: string }]
}>()

const isSubmitting = ref(false)
const selectedDuration = ref(15) // минуты
const reason = ref('')

const durations = [
  { value: 15, label: '15 минут' },
  { value: 60, label: '1 час' },
  { value: 1440, label: '24 часа' },
  { value: 10080, label: '7 дней' }
]

const handleSubmit = async () => {
  isSubmitting.value = true
  emit('mute', {
    userId: props.userId,
    duration: selectedDuration.value,
    reason: reason.value.trim()
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
            Замутить пользователя
          </h3>
          <button
            @click="emit('close')"
            class="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- User info -->
        <p class="text-sm text-[var(--text-muted)] mb-4">
          Пользователь <span class="text-[var(--text-primary)] font-medium">{{ userName }}</span>
          не сможет писать сообщения в течение выбранного времени.
        </p>

        <!-- Duration selection -->
        <div class="mb-4">
          <label class="text-xs text-[var(--text-muted)] mb-2 block">Длительность</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="d in durations"
              :key="d.value"
              @click="selectedDuration = d.value"
              class="px-3 py-2 text-sm rounded-lg border transition-colors"
              :class="selectedDuration === d.value
                ? 'bg-primary/20 border-primary text-primary'
                : 'border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-white/5'"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <!-- Reason -->
        <div class="mb-6">
          <label class="text-xs text-[var(--text-muted)] mb-2 block">Причина (необязательно)</label>
          <textarea
            v-model="reason"
            rows="2"
            maxlength="200"
            class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Укажите причину мута..."
          />
        </div>

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
            class="flex-1 px-4 py-2 text-sm rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
            :disabled="isSubmitting"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:speaker-x-mark" class="w-4 h-4" />
            Замутить
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
