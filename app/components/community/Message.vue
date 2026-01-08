<script setup lang="ts">
import type { CommunityMessage } from '~/types/community'

const props = defineProps<{
  message: CommunityMessage
  isOwn: boolean
  showModeration?: boolean
  isUserModerator?: boolean
}>()

const emit = defineEmits<{
  reply: [message: CommunityMessage]
  pin: [messageId: number]
  delete: [messageId: number]
  report: [messageId: number]
  mute: [userId: number]
  retry: [tempId: string]
  contextmenu: [event: MouseEvent, message: CommunityMessage]
}>()

// IRC-style time format: [HH:MM]
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

// Display name: nickname > firstName
const displayName = computed(() => {
  if (!props.message.user) return 'Аноним'
  return props.message.user.nickname || props.message.user.firstName || 'Аноним'
})

// Truncate helper for reply preview
const truncate = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

// Context menu handler
const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', event, props.message)
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-2 px-3 py-0.5 hover:bg-white/5 cursor-default select-text',
      message.isDeleted && 'opacity-50',
      message.status === 'sending' && 'opacity-60',
      message.status === 'failed' && 'bg-red-500/10'
    ]"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- Time -->
    <span class="text-xs text-[var(--text-muted)] w-11 flex-shrink-0 font-mono tabular-nums">
      {{ formattedTime }}
    </span>

    <!-- Nickname -->
    <span
      :class="[
        'font-medium flex-shrink-0',
        isOwn ? 'text-primary' : 'text-secondary'
      ]"
    >&lt;{{ displayName }}&gt;</span>

    <!-- Message content -->
    <span class="flex-1 break-words text-[var(--text-primary)]">
      <!-- Reply quote (inline) -->
      <span v-if="message.replyTo" class="text-[var(--text-muted)] text-sm mr-1">
        <Icon name="heroicons:arrow-uturn-left" class="w-3 h-3 inline -mt-0.5" />
        {{ message.replyTo.user?.firstName }}:
        {{ truncate(message.replyTo.content, 25) }} —
      </span>

      <!-- Content -->
      <span v-if="message.isDeleted" class="italic text-[var(--text-muted)]">Сообщение удалено</span>
      <template v-else>
        <!-- Image -->
        <template v-if="message.contentType === 'image' && message.imageUrl">
          <a :href="message.imageUrl" target="_blank" class="text-primary hover:underline">
            [изображение]
          </a>
          <span v-if="message.content" class="ml-1">{{ message.content }}</span>
        </template>
        <!-- Text only -->
        <span v-else class="whitespace-pre-wrap">{{ message.content }}</span>
      </template>

      <!-- Pinned badge -->
      <Icon
        v-if="message.isPinned"
        name="heroicons:bookmark-solid"
        class="inline w-3 h-3 text-yellow-400 ml-1"
        title="Закреплено"
      />

      <!-- Status indicators -->
      <Icon
        v-if="message.status === 'sending'"
        name="heroicons:arrow-path"
        class="inline w-3 h-3 animate-spin ml-1 text-[var(--text-muted)]"
      />
      <span v-if="message.status === 'failed'" class="text-xs text-red-400 ml-2">
        <Icon name="heroicons:exclamation-circle" class="inline w-3 h-3" />
        не отправлено
        <button
          @click.stop="emit('retry', String(message.id))"
          class="underline hover:no-underline ml-1"
        >
          повторить
        </button>
      </span>
    </span>

    <!-- Moderator badge -->
    <span
      v-if="isUserModerator"
      class="text-[10px] text-yellow-400 bg-yellow-400/10 px-1 rounded flex-shrink-0"
      title="Модератор"
    >MOD</span>
  </div>
</template>
