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

// Telegram-style time format: HH:MM
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
      'flex px-3 py-0.5',
      isOwn ? 'justify-end' : 'justify-start',
      message.status === 'sending' && 'opacity-60',
      message.status === 'failed' && 'opacity-80'
    ]"
  >
    <!-- Bubble -->
    <div
      :class="[
        'relative max-w-[85%] min-w-[80px] px-3 py-2 rounded-2xl select-text',
        isOwn
          ? 'bg-primary text-white rounded-br-md'
          : 'bg-white/10 text-[var(--text-primary)] rounded-bl-md',
        message.isDeleted && 'opacity-60'
      ]"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- Sender name (only for others' messages) -->
      <div
        v-if="!isOwn && message.user"
        class="flex items-center gap-1.5 mb-1"
      >
        <span class="text-sm font-medium text-secondary">{{ displayName }}</span>
        <span
          v-if="isUserModerator"
          class="text-[10px] text-yellow-400 bg-yellow-400/20 px-1.5 rounded"
        >MOD</span>
      </div>

      <!-- Reply quote -->
      <div
        v-if="message.replyTo"
        :class="[
          'mb-2 pl-2 py-1 border-l-2 rounded-r text-sm',
          isOwn
            ? 'bg-white/10 border-white/50'
            : 'bg-white/5 border-secondary/50'
        ]"
      >
        <span :class="isOwn ? 'text-white/80' : 'text-secondary'">
          {{ message.replyTo.user?.firstName || 'Аноним' }}
        </span>
        <p :class="isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'">
          {{ truncate(message.replyTo.content, 50) }}
        </p>
      </div>

      <!-- Content -->
      <div class="break-words">
        <span v-if="message.isDeleted" class="italic text-inherit/60">
          Сообщение удалено
        </span>
        <template v-else>
          <!-- Image -->
          <template v-if="message.contentType === 'image' && message.imageUrl">
            <a
              :href="message.imageUrl"
              target="_blank"
              class="block mb-1"
            >
              <img
                :src="message.imageUrl"
                :width="message.imageWidth || undefined"
                :height="message.imageHeight || undefined"
                class="rounded-lg max-w-full max-h-[300px] object-cover"
                loading="lazy"
              />
            </a>
            <span v-if="message.content" class="whitespace-pre-wrap">{{ message.content }}</span>
          </template>
          <!-- Text only -->
          <span v-else class="whitespace-pre-wrap">{{ message.content }}</span>
        </template>
      </div>

      <!-- Footer: time + status -->
      <div
        :class="[
          'flex items-center justify-end gap-1 mt-1 text-[11px]',
          isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
        ]"
      >
        <!-- Pinned -->
        <Icon
          v-if="message.isPinned"
          name="heroicons:bookmark-solid"
          class="w-3 h-3 text-yellow-400"
          title="Закреплено"
        />

        <!-- Time -->
        <span>{{ formattedTime }}</span>

        <!-- Status indicators -->
        <Icon
          v-if="message.status === 'sending'"
          name="heroicons:clock"
          class="w-3 h-3"
        />
        <Icon
          v-else-if="message.status === 'failed'"
          name="heroicons:exclamation-circle"
          class="w-3 h-3 text-red-400"
        />
        <Icon
          v-else-if="isOwn"
          name="heroicons:check"
          class="w-3 h-3"
        />
      </div>

      <!-- Failed retry button -->
      <button
        v-if="message.status === 'failed'"
        @click.stop="emit('retry', String(message.id))"
        :class="[
          'absolute -bottom-5 text-xs underline',
          isOwn ? 'right-0 text-red-400' : 'left-0 text-red-400'
        ]"
      >
        Повторить
      </button>
    </div>
  </div>
</template>
