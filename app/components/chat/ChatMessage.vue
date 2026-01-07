<script setup lang="ts">
interface ChatMessage {
  id: number
  chat_id: number
  sender_type: 'user' | 'admin' | 'system'
  sender_id: number
  sender_name: string | null
  content: string
  content_type: string
  is_read: boolean
  created_at: string
}

const props = defineProps<{
  message: ChatMessage
}>()

const isUser = computed(() => props.message.sender_type === 'user')
const isAdmin = computed(() => props.message.sender_type === 'admin')
const isSystem = computed(() => props.message.sender_type === 'system')

const formattedTime = computed(() => {
  const date = new Date(props.message.created_at)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const senderLabel = computed(() => {
  if (isAdmin.value) return props.message.sender_name || 'Оператор'
  if (isSystem.value) return 'Система'
  return 'Вы'
})
</script>

<template>
  <div
    class="flex gap-2"
    :class="isUser ? 'flex-row-reverse' : 'flex-row'"
  >
    <!-- Avatar -->
    <div
      class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
      :class="{
        'bg-primary/20': isUser,
        'bg-info/20': isAdmin,
        'bg-white/10': isSystem
      }"
    >
      <Icon
        :name="isUser ? 'heroicons:user' : isAdmin ? 'heroicons:user-circle' : 'heroicons:information-circle'"
        class="w-4 h-4"
        :class="{
          'text-primary': isUser,
          'text-info': isAdmin,
          'text-[var(--text-muted)]': isSystem
        }"
      />
    </div>

    <!-- Message -->
    <div
      class="max-w-[75%] rounded-2xl px-4 py-2"
      :class="{
        'bg-primary text-white rounded-br-md': isUser,
        'bg-white/10 text-[var(--text-primary)] rounded-bl-md': !isUser
      }"
    >
      <!-- Sender label for non-user messages -->
      <div
        v-if="!isUser"
        class="text-xs font-medium mb-1"
        :class="{
          'text-info': isAdmin,
          'text-[var(--text-muted)]': isSystem
        }"
      >
        {{ senderLabel }}
      </div>

      <!-- Message text -->
      <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>

      <!-- Time -->
      <div
        class="text-[10px] mt-1"
        :class="isUser ? 'text-white/70 text-right' : 'text-[var(--text-muted)]'"
      >
        {{ formattedTime }}
      </div>
    </div>
  </div>
</template>
