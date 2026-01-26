<script setup lang="ts">
import type { CommunityMessage } from '~/types/community'

const props = defineProps<{
  message: CommunityMessage
  isOwn: boolean
  showModeration?: boolean
  isUserModerator?: boolean
  groupPosition?: 'start' | 'middle' | 'end' | 'single'
}>()

const emit = defineEmits<{
  reply: [message: CommunityMessage]
  pin: [messageId: number]
  delete: [messageId: number]
  report: [messageId: number]
  mute: [userId: number]
  retry: [tempId: string]
  contextmenu: [event: MouseEvent, message: CommunityMessage]
  scrollToMessage: [messageId: string]
}>()

// Telegram WebApp для тактильной отдачи
const { haptic } = useTwa()

// Формат времени в стиле Telegram: ЧЧ:ММ
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

// Отображаемое имя: nickname > firstName
const displayName = computed(() => {
  if (!props.message.user) return 'Аноним'
  return props.message.user.nickname || props.message.user.firstName || 'Аноним'
})

// Показывать имя отправителя только для первого сообщения в группе
const showSenderName = computed(() => {
  if (props.isOwn) return false
  return props.groupPosition === 'start' || props.groupPosition === 'single'
})

// Хелпер для обрезки текста в превью ответа
function truncate(text: string, length: number) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

// Обработчик контекстного меню
function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.message)
}

// Клик по цитате для прокрутки к оригинальному сообщению
function handleQuoteClick() {
  if (props.message.replyTo?.id) {
    emit('scrollToMessage', props.message.replyTo.id)
  }
}

// ============================================
// Свайп для ответа
// ============================================
const messageRef = ref<HTMLElement>()
const swipeX = ref(0)
const isSwiping = ref(false)
const swipeThreshold = 60 // px для активации ответа
const swipeMaxDistance = 80 // макс. расстояние свайпа
let startX = 0
let startY = 0
let isHorizontalSwipe: boolean | null = null

const swipeStyle = computed(() => {
  if (swipeX.value === 0) return {}
  return {
    transform: `translateX(${Math.min(swipeX.value, swipeMaxDistance)}px)`,
    transition: isSwiping.value ? 'none' : 'transform 0.2s ease-out',
  }
})

const swipeIconOpacity = computed(() => {
  return Math.min(swipeX.value / swipeThreshold, 1)
})

function onTouchStart(e: TouchEvent) {
  // Не свайпаем удалённые или отправляемые сообщения
  if (props.message.isDeleted || props.message.status === 'sending') return

  const touch = e.touches[0]
  if (!touch) return

  startX = touch.clientX
  startY = touch.clientY
  isHorizontalSwipe = null
  isSwiping.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return

  const touch = e.touches[0]
  if (!touch) return

  const currentX = touch.clientX
  const currentY = touch.clientY
  const diffX = currentX - startX
  const diffY = currentY - startY

  // Определяем направление свайпа при первом значительном движении
  if (isHorizontalSwipe === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
    isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY)
  }

  // Обрабатываем только горизонтальные свайпы вправо
  if (isHorizontalSwipe && diffX > 0) {
    e.preventDefault() // Предотвращаем скролл
    swipeX.value = Math.min(diffX, swipeMaxDistance)

    // Тактильная отдача при достижении порога
    if (swipeX.value >= swipeThreshold && diffX - 5 < swipeThreshold) {
      haptic?.impactOccurred('light')
    }
  }
}

function onTouchEnd() {
  if (!isSwiping.value) return

  // Активируем ответ если свайпнули достаточно
  if (swipeX.value >= swipeThreshold) {
    haptic?.impactOccurred('medium')
    emit('reply', props.message)
  }

  // Сброс
  swipeX.value = 0
  isSwiping.value = false
  isHorizontalSwipe = null
}
</script>

<template>
  <div
    ref="messageRef"
    :class="[
      'flex px-3',
      isOwn ? 'justify-end' : 'justify-start',
      groupPosition === 'start' && 'mt-2',
      groupPosition === 'middle' && 'mt-0.5',
      groupPosition === 'end' && 'mt-0.5',
      groupPosition === 'single' && 'mt-2'
    ]"
    :style="swipeStyle"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Swipe reply icon (appears on left during swipe) -->
    <div
      v-if="swipeX > 0"
      class="tg-swipe-reply-icon"
      :style="{ opacity: swipeIconOpacity }"
    >
      <Icon name="heroicons:arrow-uturn-left" class="w-4 h-4 text-white" />
    </div>

    <!-- Bubble -->
    <div
      :class="[
        'tg-bubble select-text',
        isOwn ? 'tg-bubble-own' : 'tg-bubble-other',
        message.status === 'sending' && 'opacity-60',
        message.status === 'failed' && 'opacity-80',
        message.isDeleted && 'opacity-60',
        // Group position classes for rounded corners
        groupPosition && `tg-message-group-${groupPosition}`
      ]"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- Sender name (only for others' first message in group) -->
      <div v-if="showSenderName" class="tg-sender-name flex items-center gap-1.5">
        <span>{{ displayName }}</span>
        <span
          v-if="isUserModerator"
          class="text-[10px] text-yellow-400 bg-yellow-400/20 px-1.5 rounded"
        >MOD</span>
      </div>

      <!-- Reply quote -->
      <div
        v-if="message.replyTo"
        class="tg-quote"
        @click="handleQuoteClick"
      >
        <div class="tg-quote-name">
          {{ message.replyTo.user?.firstName || 'Аноним' }}
        </div>
        <div class="tg-quote-text">
          {{ truncate(message.replyTo.content, 50) }}
        </div>
      </div>

      <!-- Content -->
      <div class="break-words">
        <span v-if="message.isDeleted" class="italic opacity-60">
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

        <!-- Time and status (inline at end of text) -->
        <span class="tg-time">
          <!-- Pinned -->
          <Icon
            v-if="message.isPinned"
            name="heroicons:bookmark-solid"
            class="w-3 h-3 text-yellow-400 inline mr-1"
            title="Закреплено"
          />
          {{ formattedTime }}
          <!-- Status indicators -->
          <Icon
            v-if="message.status === 'sending'"
            name="heroicons:clock"
            class="w-3 h-3 inline ml-0.5"
          />
          <Icon
            v-else-if="message.status === 'failed'"
            name="heroicons:exclamation-circle"
            class="w-3 h-3 text-red-400 inline ml-0.5"
          />
          <Icon
            v-else-if="isOwn"
            name="heroicons:check"
            class="w-3 h-3 inline ml-0.5"
          />
        </span>
      </div>

      <!-- Failed retry button -->
      <button
        v-if="message.status === 'failed'"
        @click.stop="emit('retry', String(message.id))"
        :class="[
          'absolute -bottom-5 text-xs underline text-red-400',
          isOwn ? 'right-0' : 'left-0'
        ]"
      >
        Повторить
      </button>
    </div>
  </div>
</template>
