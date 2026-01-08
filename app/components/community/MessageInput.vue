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
  <div class="border-t border-white/10 p-3">
    <!-- Reply preview -->
    <div
      v-if="replyTo"
      class="mb-2 flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded text-sm"
    >
      <Icon name="heroicons:arrow-uturn-left" class="w-3 h-3 text-primary flex-shrink-0" />
      <span class="text-primary font-medium">{{ replyTo.user?.firstName }}:</span>
      <span class="text-[var(--text-muted)] truncate flex-1">{{ replyTo.content }}</span>
      <button @click="emit('cancelReply')" class="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- Input row -->
    <div class="flex items-center gap-2">
      <!-- Image upload -->
      <button
        @click="fileInput?.click()"
        :disabled="disabled"
        class="p-2 rounded hover:bg-white/10 disabled:opacity-50 text-[var(--text-muted)]"
        title="Изображение"
      >
        <Icon name="heroicons:photo" class="w-5 h-5" />
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Text input -->
      <input
        v-model="text"
        @keydown="handleKeydown"
        @input="emit('typing')"
        :disabled="disabled"
        placeholder="Сообщение..."
        class="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 disabled:opacity-50"
      />

      <!-- Send button -->
      <button
        @click="handleSend"
        :disabled="!text.trim() || disabled"
        class="px-4 py-2 rounded bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium"
      >
        Отправить
      </button>
    </div>
  </div>
</template>
