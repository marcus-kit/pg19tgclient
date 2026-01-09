<script setup lang="ts">
import type { CommunityMessage } from '~/types/community'

const props = defineProps<{
  messages: CommunityMessage[]
  currentUserId?: string | number
  showModeration?: boolean
  isUserModerator?: (userId: string | number) => boolean
}>()

const emit = defineEmits<{
  contextmenu: [event: MouseEvent, message: CommunityMessage]
  retry: [tempId: string]
}>()

// Группировка сообщений по датам
interface MessageGroup {
  dateLabel: string
  date: Date
  messages: CommunityMessage[]
}

const groupedMessages = computed<MessageGroup[]>(() => {
  if (!props.messages.length) return []

  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const formatDateLabel = (date: Date): string => {
    const msgDate = new Date(date)
    msgDate.setHours(0, 0, 0, 0)

    if (msgDate.getTime() === today.getTime()) {
      return 'Сегодня'
    }
    if (msgDate.getTime() === yesterday.getTime()) {
      return 'Вчера'
    }

    return msgDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    })
  }

  for (const msg of props.messages) {
    const msgDate = new Date(msg.createdAt)
    msgDate.setHours(0, 0, 0, 0)
    const dateLabel = formatDateLabel(msgDate)

    if (!currentGroup || currentGroup.dateLabel !== dateLabel) {
      currentGroup = {
        dateLabel,
        date: msgDate,
        messages: []
      }
      groups.push(currentGroup)
    }

    currentGroup.messages.push(msg)
  }

  return groups
})
</script>

<template>
  <div class="flex flex-col gap-1 py-2">
    <template v-for="group in groupedMessages" :key="group.dateLabel">
      <!-- Date separator -->
      <div class="flex items-center justify-center my-3">
        <span class="px-3 py-1 text-xs text-[var(--text-muted)] bg-white/10 rounded-full">
          {{ group.dateLabel }}
        </span>
      </div>

      <!-- Messages in group -->
      <CommunityMessage
        v-for="msg in group.messages"
        :key="msg.id"
        :message="msg"
        :is-own="String(msg.userId) === String(currentUserId)"
        :show-moderation="showModeration"
        :is-user-moderator="isUserModerator?.(msg.userId)"
        @contextmenu="(event) => emit('contextmenu', event, msg)"
        @retry="(id) => emit('retry', id)"
      />
    </template>

    <!-- Empty state -->
    <div v-if="!messages.length" class="text-center py-12">
      <p class="text-[var(--text-muted)]">Нет сообщений</p>
      <p class="text-sm text-[var(--text-muted)] mt-1">Напишите первое!</p>
    </div>
  </div>
</template>
