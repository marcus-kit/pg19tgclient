<script setup lang="ts">
import type { CommunityMessage } from '~/types/community'

const props = defineProps<{
  disabled?: boolean
  replyTo?: CommunityMessage | null
}>()

const emit = defineEmits<{
  send: [content: string, options?: { replyToId?: number }]
  cancelReply: []
  upload: [file: File]
  typing: []
}>()

const text = ref('')
const fileInput = ref<HTMLInputElement>()

const handleSend = () => {
  if (!text.value.trim() || props.disabled) return

  emit('send', text.value, {
    replyToId: props.replyTo?.id
  })

  text.value = ''
  emit('cancelReply')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Максимальный размер файла: 5 МБ')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения')
      return
    }

    emit('upload', file)
  }

  input.value = ''
}
</script>

<template>
  <div class="border-t border-white/10 p-2 safe-area-pb">
    <!-- Reply preview (Telegram style) -->
    <div
      v-if="replyTo"
      class="mb-2 mx-1 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border-l-2 border-primary"
    >
      <Icon name="heroicons:arrow-uturn-left" class="w-4 h-4 text-primary flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <span class="text-sm font-medium text-primary">{{ replyTo.user?.firstName || 'Аноним' }}</span>
        <p class="text-sm text-[var(--text-muted)] truncate">{{ replyTo.content }}</p>
      </div>
      <button
        @click="emit('cancelReply')"
        class="p-1 rounded-full hover:bg-white/10 text-[var(--text-muted)]"
      >
        <Icon name="heroicons:x-mark" class="w-5 h-5" />
      </button>
    </div>

    <!-- Input row (Telegram style) -->
    <div class="flex items-center gap-1">
      <!-- Image upload -->
      <button
        @click="fileInput?.click()"
        :disabled="disabled"
        class="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 disabled:opacity-50 text-[var(--text-muted)] transition-colors"
        title="Изображение"
      >
        <Icon name="heroicons:paper-clip" class="w-5 h-5" />
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Text input (pill style) -->
      <input
        v-model="text"
        @keydown="handleKeydown"
        @input="emit('typing')"
        :disabled="disabled"
        placeholder="Сообщение..."
        class="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
      />

      <!-- Send button (circle icon) -->
      <button
        @click="handleSend"
        :disabled="!text.trim() || disabled"
        class="p-2.5 rounded-full bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:bg-white/10 text-white transition-all"
      >
        <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
