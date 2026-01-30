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
  reply: [message: CommunityMessage]
  scrollToMessage: [messageId: string]
}>()

// Refs for scroll-to-message functionality
const messageRefs = ref<Map<string, HTMLElement>>(new Map())
const highlightedMessageId = ref<string | null>(null)

// Register message element ref
function setMessageRef(id: string, el: HTMLElement | null) {
  if (el) {
    messageRefs.value.set(id, el)
  }
  else {
    messageRefs.value.delete(id)
  }
}

// Scroll to message and highlight
function scrollToMessage(messageId: string) {
  const el = messageRefs.value.get(messageId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Highlight effect
    highlightedMessageId.value = messageId
    setTimeout(() => {
      highlightedMessageId.value = null
    }, 1500)
  }
}

// Expose for parent component
defineExpose({ scrollToMessage })

// Watch for scroll requests from child
function handleScrollToMessage(messageId: string) {
  scrollToMessage(messageId)
  emit('scrollToMessage', messageId)
}

// Message grouping by date and author
interface MessageWithMeta extends CommunityMessage {
  groupPosition: 'start' | 'middle' | 'end' | 'single'
}

interface MessageGroup {
  dateLabel: string
  date: Date
  messages: MessageWithMeta[]
}

const groupedMessages = computed<MessageGroup[]>(() => {
  if (!props.messages.length) return []

  const groups: MessageGroup[] = []
  let currentDateGroup: MessageGroup | null = null

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
      month: 'long',
    })
  }

  // Group by date first
  for (const msg of props.messages) {
    const msgDate = new Date(msg.createdAt)
    msgDate.setHours(0, 0, 0, 0)
    const dateLabel = formatDateLabel(msgDate)

    if (!currentDateGroup || currentDateGroup.dateLabel !== dateLabel) {
      currentDateGroup = {
        dateLabel,
        date: msgDate,
        messages: [],
      }
      groups.push(currentDateGroup)
    }

    // Add message with default position
    currentDateGroup.messages.push({
      ...msg,
      groupPosition: 'single',
    })
  }

  // Calculate author grouping within each date group
  for (const group of groups) {
    const msgs = group.messages
    for (let i = 0; i < msgs.length; i++) {
      const current = msgs[i]
      const prev = i > 0 ? msgs[i - 1] : null
      const next = i < msgs.length - 1 ? msgs[i + 1] : null

      const sameAsPrev = prev && String(prev.userId) === String(current.userId)
      const sameAsNext = next && String(next.userId) === String(current.userId)

      // Check time gap (messages within 2 minutes are grouped)
      const timePrev = prev ? new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity
      const timeNext = next ? new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime() : Infinity
      const maxGap = 2 * 60 * 1000 // 2 minutes

      const groupWithPrev = sameAsPrev && timePrev < maxGap
      const groupWithNext = sameAsNext && timeNext < maxGap

      if (groupWithPrev && groupWithNext) {
        current.groupPosition = 'middle'
      }
      else if (groupWithPrev && !groupWithNext) {
        current.groupPosition = 'end'
      }
      else if (!groupWithPrev && groupWithNext) {
        current.groupPosition = 'start'
      }
      else {
        current.groupPosition = 'single'
      }
    }
  }

  return groups
})
</script>

<template>
  <div class="flex flex-col py-2">
    <template
      v-for="group in groupedMessages"
      :key="group.dateLabel"
    >
      <!-- Date separator (Telegram style) -->
      <div class="tg-date-separator">
        <span class="tg-date-label">{{ group.dateLabel }}</span>
      </div>

      <!-- Messages in group -->
      <div
        v-for="msg in group.messages"
        :key="msg.id"
        :ref="(el) => setMessageRef(String(msg.id), el as HTMLElement)"
        :class="{ 'tg-highlight': highlightedMessageId === String(msg.id) }"
      >
        <CommunityMessage
          :message="msg"
          :is-own="String(msg.userId) === String(currentUserId)"
          :show-moderation="showModeration"
          :is-user-moderator="isUserModerator?.(msg.userId)"
          :group-position="msg.groupPosition"
          @contextmenu="(event) => emit('contextmenu', event, msg)"
          @retry="(id) => emit('retry', id)"
          @reply="emit('reply', msg)"
          @scroll-to-message="handleScrollToMessage"
        />
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-if="!messages.length"
      class="text-center py-12"
    >
      <p class="text-[var(--text-muted)]">
        Нет сообщений
      </p>
      <p class="text-sm text-[var(--text-muted)] mt-1">
        Напишите первое!
      </p>
    </div>
  </div>
</template>
