<script setup lang="ts">
import type { CommunityRoom, CommunityMessage, CommunityReportReason, CommunityRoomLevel } from '~/types/community'

definePageMeta({
  layout: 'twa'
})

const authStore = useAuthStore()
const {
  rooms,
  currentRoom,
  messages,
  pinnedMessages,
  isLoadingRooms,
  isLoadingMessages,
  isSending,
  hasMoreMessages,
  isMuted,
  mutedUntil,
  error,
  typingUsers,
  onlineCount,
  loadRooms,
  selectRoom,
  loadMore,
  sendMessage,
  retryMessage,
  uploadImage,
  togglePin,
  deleteMessage,
  isModerator,
  isUserModerator,
  muteUser,
  reportMessage,
  broadcastTyping
} = useCommunityChat()

// Загружаем комнаты при монтировании
onMounted(async () => {
  await loadRooms()

  // Автовыбор комнаты здания (или первой доступной)
  if (rooms.value.length > 0) {
    const buildingRoom = rooms.value.find(r => r.level === 'building')
    await selectRoom(buildingRoom || rooms.value[0])
  }
})

// Обновляем данные при реактивации из KeepAlive кэша
onActivated(async () => {
  // Перезагружаем комнаты (обновит unreadCount и другие данные)
  await loadRooms()
})

// Реф контейнера сообщений для автоскролла
const messagesContainer = ref<HTMLElement>()

// Автоскролл при новых сообщениях
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Состояние ответа на сообщение
const replyTo = ref<CommunityMessage | null>(null)

// Состояние контекстного меню
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  message: null as CommunityMessage | null
})

// Обработчики
async function handleSend(content: string, options?: { replyToId?: number }) {
  await sendMessage(content, options)
}

async function handleUpload(file: File) {
  const { url, width, height } = await uploadImage(file)
  await sendMessage('', { imageUrl: url, imageWidth: width, imageHeight: height })
}

async function handlePin(messageId: number) {
  await togglePin(messageId)
}

async function handleDelete(messageId: number) {
  if (confirm('Удалить это сообщение?')) {
    await deleteMessage(messageId)
  }
}

async function handleRetry(tempId: string) {
  await retryMessage(tempId)
}

async function handleRoomSelect(room: CommunityRoom) {
  await selectRoom(room)
}

// Обработчики контекстного меню
function handleContextMenu(event: MouseEvent, message: CommunityMessage) {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    message,
  }
}

function closeContextMenu() {
  contextMenu.value.show = false
}

function handleContextReply() {
  if (contextMenu.value.message) {
    replyTo.value = contextMenu.value.message
  }
}

function handleContextPin() {
  if (contextMenu.value.message) {
    handlePin(contextMenu.value.message.id as number)
  }
}

function handleContextDelete() {
  if (contextMenu.value.message) {
    handleDelete(contextMenu.value.message.id as number)
  }
}

// Проверка модерации
const showModeration = computed(() => isModerator())

// Иконки уровней комнат
function levelIcon(level: CommunityRoomLevel) {
  switch (level) {
    case 'city': return 'heroicons:building-office-2'
    case 'district': return 'heroicons:map'
    case 'building': return 'heroicons:home'
    default: return 'heroicons:chat-bubble-left-right'
  }
}

// Сортировка комнат: город → район → здание
const levelOrder: Record<CommunityRoomLevel, number> = {
  city: 0,
  district: 1,
  building: 2
}

const sortedRooms = computed(() => {
  return [...rooms.value].sort((a, b) => {
    return (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99)
  })
})

// =====================================================
// Mute Modal
// =====================================================
const showMuteModal = ref(false)
const muteTargetUserId = ref<number | null>(null)
const muteTargetUserName = ref('')

function handleMuteClick(userId: number) {
  const msg = messages.value.find(m => m.userId === userId)
  muteTargetUserName.value = msg?.user?.nickname || msg?.user?.firstName || 'Пользователь'
  muteTargetUserId.value = userId
  showMuteModal.value = true
}

async function handleMuteSubmit(data: { userId: number; duration: number; reason: string }) {
  try {
    await muteUser(data.userId, data.duration, data.reason || undefined)
    showMuteModal.value = false
    muteTargetUserId.value = null
  } catch {
    // Ошибка обрабатывается в composable
  }
}

// =====================================================
// Report Modal
// =====================================================
const showReportModal = ref(false)
const reportTargetMessageId = ref<number | null>(null)

function handleReportClick(messageId: number) {
  reportTargetMessageId.value = messageId
  showReportModal.value = true
}

async function handleReportSubmit(data: { messageId: number; reason: CommunityReportReason; details: string }) {
  try {
    await reportMessage(data.messageId, data.reason, data.details || undefined)
    showReportModal.value = false
    reportTargetMessageId.value = null
  } catch {
    // Ошибка обрабатывается в composable
  }
}

// =====================================================
// Muted status banner
// =====================================================
const mutedUntilFormatted = computed(() => {
  if (!mutedUntil.value) return null
  return new Date(mutedUntil.value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Обработчик бесконечной прокрутки
function handleScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop < 100 && hasMoreMessages.value && !isLoadingMessages.value) {
    loadMore()
  }
}
</script>

<template>
  <div class="community-page">
    <!-- Top Channel Tabs (fixed below TwaHeader) -->
    <header
      class="community-header fixed left-0 right-0 z-20 border-b border-white/10 bg-[var(--tg-bg-color,var(--bg-base))]"
      :style="{ top: 'calc(56px + var(--twa-safe-top, 0px))' }"
    >
      <!-- Title row with members and online count -->
      <div class="flex items-center justify-between px-3 py-1">
        <div class="flex items-center gap-2">
          <h2 class="font-bold text-[var(--text-primary)]">Сообщество</h2>
          <span v-if="currentRoom" class="text-xs text-[var(--text-muted)]">
            {{ currentRoom.membersCount }} участников
          </span>
        </div>
        <p class="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {{ onlineCount }} онлайн
        </p>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingRooms" class="flex items-center justify-center py-2">
        <Icon name="heroicons:arrow-path" class="w-5 h-5 text-primary animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="sortedRooms.length === 0" class="text-center py-2 px-3">
        <p class="text-[var(--text-muted)] text-sm">Нет доступных чатов. Укажите адрес в профиле.</p>
      </div>

      <!-- Channel tabs -->
      <div v-else class="flex gap-1 px-2 pb-1.5 overflow-x-auto">
        <button
          v-for="room in sortedRooms"
          :key="room.id"
          @click="handleRoomSelect(room)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors',
            currentRoom?.id === room.id
              ? 'bg-primary text-white'
              : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]'
          ]"
        >
          <Icon :name="levelIcon(room.level)" class="w-4 h-4 flex-shrink-0" />
          <span>{{ room.name }}</span>
          <span
            v-if="room.unreadCount"
            :class="[
              'text-[10px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center',
              currentRoom?.id === room.id ? 'bg-white/20 text-white' : 'bg-primary text-white'
            ]"
          >
            {{ room.unreadCount > 99 ? '99+' : room.unreadCount }}
          </span>
        </button>
      </div>
    </header>

    <!-- Chat Area (scrollable between fixed header and input) -->
    <main class="community-content">
      <template v-if="currentRoom">
        <!-- Pinned messages -->
        <CommunityPinnedMessages
          v-if="pinnedMessages.length > 0"
          :messages="pinnedMessages"
        />

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="messages-scroll"
          @scroll="handleScroll"
        >
          <!-- Loading indicator for history -->
          <div v-if="isLoadingMessages && messages.length > 0" class="text-center py-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 text-primary animate-spin mx-auto" />
          </div>

          <!-- Messages list (Telegram bubble style with date grouping) -->
          <CommunityMessageList
            :messages="messages"
            :current-user-id="authStore.user?.id"
            :show-moderation="showModeration"
            :is-user-moderator="isUserModerator"
            @contextmenu="handleContextMenu"
            @retry="handleRetry"
            @reply="(msg) => replyTo = msg"
          />
        </div>
      </template>

      <!-- No room selected -->
      <div v-else class="flex-1 flex items-center justify-center h-full">
        <p class="text-[var(--text-muted)]">Выберите канал выше</p>
      </div>
    </main>

    <!-- Fixed bottom area (above TwaMobileNav) -->
    <footer
      v-if="currentRoom"
      class="community-footer fixed left-0 right-0 z-20 bg-[var(--tg-bg-color,var(--bg-base))]"
      :style="{ bottom: 'calc(64px + var(--twa-safe-bottom, 0px))' }"
    >
      <!-- Typing indicator -->
      <CommunityTypingIndicator :typing-users="typingUsers" />

      <!-- Muted banner -->
      <div
        v-if="isMuted"
        class="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2"
      >
        <Icon name="heroicons:speaker-x-mark" class="w-4 h-4" />
        <span>Вы не можете писать до {{ mutedUntilFormatted }}</span>
      </div>

      <!-- Input -->
      <CommunityMessageInput
        :disabled="isSending || isMuted"
        :reply-to="replyTo"
        @send="handleSend"
        @cancel-reply="replyTo = null"
        @upload="handleUpload"
        @typing="broadcastTyping"
      />
    </footer>

    <!-- Context Menu -->
    <CommunityContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :is-own="contextMenu.message?.userId === authStore.user?.id"
      :is-pinned="contextMenu.message?.isPinned || false"
      :show-moderation="showModeration"
      @close="closeContextMenu"
      @reply="handleContextReply"
      @report="contextMenu.message && handleReportClick(contextMenu.message.id as number)"
      @pin="handleContextPin"
      @mute="contextMenu.message && handleMuteClick(contextMenu.message.userId)"
      @delete="handleContextDelete"
    />

    <!-- Modals -->
    <CommunityMuteModal
      v-if="showMuteModal && muteTargetUserId"
      :user-id="muteTargetUserId"
      :user-name="muteTargetUserName"
      @close="showMuteModal = false"
      @mute="handleMuteSubmit"
    />

    <CommunityReportModal
      v-if="showReportModal && reportTargetMessageId"
      :message-id="reportTargetMessageId"
      @close="showReportModal = false"
      @report="handleReportSubmit"
    />
  </div>
</template>

<style scoped>
.community-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--tg-bg-color, var(--bg-base));
}

.community-content {
  position: absolute;
  left: 0;
  right: 0;
  /* Top: TwaHeader (56px + safe-top) + CommunityHeader (~70px) */
  top: calc(56px + var(--twa-safe-top, 0px) + 70px);
  /* Bottom: TwaMobileNav (64px + safe-bottom) + CommunityFooter (~56px) */
  bottom: calc(64px + var(--twa-safe-bottom, 0px) + 56px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Glass card effect */
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  margin: 0 8px;
  border-radius: 16px;
}

.messages-scroll {
  flex: 1;
  overflow-y: auto;
  font-size: 0.875rem;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

/* Hide scrollbar but keep functionality */
.messages-scroll::-webkit-scrollbar {
  display: none;
}

.messages-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
