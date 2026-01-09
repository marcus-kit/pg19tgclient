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

// Load rooms on mount
onMounted(async () => {
  await loadRooms()

  // Auto-select building room (or first available)
  if (rooms.value.length > 0) {
    const buildingRoom = rooms.value.find(r => r.level === 'building')
    await selectRoom(buildingRoom || rooms.value[0])
  }
})

// Messages container ref for auto-scroll
const messagesContainer = ref<HTMLElement>()

// Auto-scroll on new messages
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Reply state
const replyTo = ref<CommunityMessage | null>(null)

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  message: null as CommunityMessage | null
})

// Handlers
const handleSend = async (content: string, options?: { replyToId?: number }) => {
  await sendMessage(content, options)
}

const handleUpload = async (file: File) => {
  const { url, width, height } = await uploadImage(file)
  await sendMessage('', { imageUrl: url, imageWidth: width, imageHeight: height })
}

const handlePin = async (messageId: number) => {
  await togglePin(messageId)
}

const handleDelete = async (messageId: number) => {
  if (confirm('Удалить это сообщение?')) {
    await deleteMessage(messageId)
  }
}

const handleRetry = async (tempId: string) => {
  await retryMessage(tempId)
}

const handleRoomSelect = async (room: CommunityRoom) => {
  await selectRoom(room)
}

// Context menu handlers
const handleContextMenu = (event: MouseEvent, message: CommunityMessage) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    message
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextReply = () => {
  if (contextMenu.value.message) {
    replyTo.value = contextMenu.value.message
  }
}

const handleContextPin = () => {
  if (contextMenu.value.message) {
    handlePin(contextMenu.value.message.id as number)
  }
}

const handleContextDelete = () => {
  if (contextMenu.value.message) {
    handleDelete(contextMenu.value.message.id as number)
  }
}

// Moderation check
const showModeration = computed(() => isModerator())

// Level icons
const levelIcon = (level: CommunityRoomLevel) => {
  switch (level) {
    case 'city': return 'heroicons:building-office-2'
    case 'district': return 'heroicons:map'
    case 'building': return 'heroicons:home'
    default: return 'heroicons:chat-bubble-left-right'
  }
}

// =====================================================
// Mute Modal
// =====================================================
const showMuteModal = ref(false)
const muteTargetUserId = ref<number | null>(null)
const muteTargetUserName = ref('')

const handleMuteClick = (userId: number) => {
  const msg = messages.value.find(m => m.userId === userId)
  muteTargetUserName.value = msg?.user?.nickname || msg?.user?.firstName || 'Пользователь'
  muteTargetUserId.value = userId
  showMuteModal.value = true
}

const handleMuteSubmit = async (data: { userId: number; duration: number; reason: string }) => {
  try {
    await muteUser(data.userId, data.duration, data.reason || undefined)
    showMuteModal.value = false
    muteTargetUserId.value = null
  } catch {
    // Error handled in composable
  }
}

// =====================================================
// Report Modal
// =====================================================
const showReportModal = ref(false)
const reportTargetMessageId = ref<number | null>(null)

const handleReportClick = (messageId: number) => {
  reportTargetMessageId.value = messageId
  showReportModal.value = true
}

const handleReportSubmit = async (data: { messageId: number; reason: CommunityReportReason; details: string }) => {
  try {
    await reportMessage(data.messageId, data.reason, data.details || undefined)
    showReportModal.value = false
    reportTargetMessageId.value = null
  } catch {
    // Error handled in composable
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

// Infinite scroll handler
const handleScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollTop < 100 && hasMoreMessages.value && !isLoadingMessages.value) {
    loadMore()
  }
}
</script>

<template>
  <div class="h-[calc(100vh-theme(spacing.16)-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.16)-theme(spacing.6))] flex flex-col bg-[var(--bg-primary)]">
    <!-- Top Channel Tabs -->
    <header class="flex-shrink-0 border-b border-white/10">
      <!-- Title row -->
      <div class="flex items-center justify-between px-4 py-2">
        <h2 class="font-bold text-[var(--text-primary)]">Сообщество</h2>
        <p class="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {{ onlineCount }} онлайн
        </p>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingRooms" class="flex items-center justify-center py-3">
        <Icon name="heroicons:arrow-path" class="w-5 h-5 text-primary animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="rooms.length === 0" class="text-center py-3 px-4">
        <p class="text-[var(--text-muted)] text-sm">Нет доступных чатов. Укажите адрес в профиле.</p>
      </div>

      <!-- Channel tabs -->
      <div v-else class="flex gap-1 px-2 pb-2 overflow-x-auto">
        <button
          v-for="room in rooms"
          :key="room.id"
          @click="handleRoomSelect(room)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
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

    <!-- Chat Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <template v-if="currentRoom">
        <!-- Room info bar -->
        <div class="flex items-center gap-2 px-4 py-2 bg-white/5 text-xs text-[var(--text-muted)]">
          <span>{{ currentRoom.membersCount }} участников</span>
        </div>

        <!-- Pinned messages -->
        <CommunityPinnedMessages
          v-if="pinnedMessages.length > 0"
          :messages="pinnedMessages"
        />

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto text-sm"
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
      </template>

      <!-- No room selected -->
      <div v-else class="flex-1 flex items-center justify-center">
        <p class="text-[var(--text-muted)]">Выберите канал выше</p>
      </div>
    </main>

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
