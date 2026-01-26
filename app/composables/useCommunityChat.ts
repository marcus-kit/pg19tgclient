// ═══════════════════════════════════════════════════════════════════════════
// useCommunityChat — Главный оркестратор чата сообщества
// ═══════════════════════════════════════════════════════════════════════════
//
// Этот composable объединяет все модули чата и управляет Realtime подпиской.
// Публичный API сохраняется для обратной совместимости.
//
// Модули:
// - useCommunityRooms — список комнат, выбор, join
// - useCommunityMessages — CRUD сообщений, optimistic UI
// - useCommunityTyping — индикаторы набора текста
// - useCommunityPresence — онлайн-пользователи
// - useCommunityModeration — роли, mute, reports
// ═══════════════════════════════════════════════════════════════════════════

import type { CommunityRoom, CommunityMessage } from '~/types/community'
import type { PresenceUser } from './community/useCommunityPresence'
import { useCommunityRooms } from './community/useCommunityRooms'
import { useCommunityMessages } from './community/useCommunityMessages'
import { useCommunityTyping } from './community/useCommunityTyping'
import { useCommunityPresence } from './community/useCommunityPresence'
import { useCommunityModeration } from './community/useCommunityModeration'

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Главный composable для чата сообщества.
 *
 * Объединяет функционал комнат, сообщений, typing, presence и модерации.
 * Управляет Supabase Realtime каналами для всех событий.
 */
export function useCommunityChat() {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED ДЛЯ ЗАВИСИМОСТЕЙ
  // ═══════════════════════════════════════════════════════════════════════════

  const userId = computed(() => authStore.user?.id)
  const userName = computed(() => authStore.user?.firstName || 'Пользователь')
  const userAvatar = computed(() => authStore.user?.avatar)
  const userGlobalRole = computed(() => authStore.user?.role)

  const messageUser = computed(() => {
    if (!authStore.user) return null
    return {
      id: authStore.user.id,
      firstName: authStore.user.firstName || 'Пользователь',
      lastName: authStore.user.lastName || '',
      avatar: authStore.user.avatar || null,
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ
  // ═══════════════════════════════════════════════════════════════════════════

  // Rooms модуль
  const roomsModule = useCommunityRooms({ supabase })

  // Messages модуль (зависит от currentRoom)
  const messagesModule = useCommunityMessages({
    currentRoom: roomsModule.currentRoom,
    user: messageUser,
  })

  // Realtime канал (ref для передачи в модули)
  const channel = ref<ReturnType<typeof supabase.channel> | null>(null)

  // Typing модуль
  const typingModule = useCommunityTyping({
    channel,
    currentRoom: roomsModule.currentRoom,
    userId,
    userName,
  })

  // Presence модуль
  const presenceModule = useCommunityPresence({
    channel,
    userId,
    userName,
    userAvatar,
  })

  // Moderation модуль
  const moderationModule = useCommunityModeration({
    currentRoom: roomsModule.currentRoom,
    userGlobalRole,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  let hasSubscribedOnce = false // Флаг для отличия reconnect от первого подключения

  // ═══════════════════════════════════════════════════════════════════════════
  // МЕТОДЫ ОРКЕСТРАЦИИ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Выбрать комнату и загрузить все данные */
  async function selectRoom(room: CommunityRoom) {
    // Отписываемся от предыдущей комнаты
    await unsubscribe()

    // Устанавливаем текущую комнату
    roomsModule.setCurrentRoom(room)

    // Сбрасываем состояние модулей
    messagesModule.reset()
    moderationModule.reset()

    // Автоматически вступаем в комнату
    await roomsModule.joinRoom(room.id)

    // Загружаем данные параллельно
    await Promise.all([
      messagesModule.loadMessages(),
      messagesModule.loadPinnedMessages(),
      moderationModule.loadUserRole(room.id),
      moderationModule.loadModerators(room.id),
    ])

    await subscribe()

    // Отмечаем как прочитанное
    await roomsModule.markAsRead()
  }

  /** Realtime подписка на комнату */
  async function subscribe() {
    const currentRoom = roomsModule.currentRoom.value
    if (!currentRoom) return

    // Отписываемся от предыдущего канала
    if (channel.value) {
      await supabase.removeChannel(channel.value)
      channel.value = null
    }

    // Очищаем typing при смене комнаты
    typingModule.reset()

    // Запускаем периодическую очистку receivedViaBroadcast
    messagesModule.enableBroadcastCleanup()

    channel.value = supabase
      .channel(`community:${currentRoom.id}`)
      // Broadcast для typing indicators
      .on(
        'broadcast',
        { event: 'typing' },
        ({ payload }) => typingModule.handleTypingBroadcast(payload),
      )
      // Broadcast для мгновенной доставки новых сообщений
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }) => {
          const message = payload as CommunityMessage
          const wasAdded = messagesModule.addRealtimeMessage(message)

          if (wasAdded) {
            // Убираем typing для автора
            typingModule.removeTyping(message.userId)
            // Уведомление
            playNotificationSound()
          }
        },
      )
      // postgres_changes для сообщений (fallback)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as { id: number; user_id: string }

          // Если уже получили через Broadcast — игнорируем
          if (messagesModule.wasReceivedViaBroadcast(newMessage.id)) return

          // Проверяем дубликат
          if (!messagesModule.messages.value.find(m => m.id === newMessage.id)) {
            // Загружаем полное сообщение с user
            const msg = await messagesModule.loadSingleMessage(newMessage.id)

            if (msg && msg.userId !== authStore.user?.id) {
              playNotificationSound()
            }
          }

          // Убираем typing для автора сообщения
          typingModule.removeTyping(newMessage.user_id)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => {
          const updated = payload.new as { id: number; is_deleted: boolean; is_pinned: boolean; content: string }
          messagesModule.handleMessageUpdate(updated)
        },
      )
      // Presence для онлайн пользователей
      .on('presence', { event: 'sync' }, () => {
        presenceModule.syncPresenceState()
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        presenceModule.handleJoin(newPresences as PresenceUser[])
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        presenceModule.handleLeave(leftPresences as PresenceUser[])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Начинаем tracking после успешной подписки
          await presenceModule.trackPresence()

          // Дозагружаем пропущенные сообщения ТОЛЬКО при reconnect
          if (hasSubscribedOnce && messagesModule.messages.value.length > 0) {
            const lastRealMessage = messagesModule.messages.value
              .filter(m => !String(m.id).startsWith('temp-'))
              .at(-1)
            if (lastRealMessage) {
              await messagesModule.loadMessagesSince(lastRealMessage.id)
            }
          }
          hasSubscribedOnce = true
        }
      })
  }

  /** Отписаться от Realtime */
  async function unsubscribe() {
    typingModule.stopTypingCleanup()
    messagesModule.cleanup()
    hasSubscribedOnce = false
    await presenceModule.untrackPresence()
    if (channel.value) {
      await supabase.removeChannel(channel.value)
      channel.value = null
    }
  }

  /** Воспроизвести звук уведомления */
  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch {
      // Игнорируем ошибки
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  onUnmounted(() => {
    void unsubscribe()
    void roomsModule.unsubscribeFromRooms()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЙ API (обратная совместимость)
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State — Rooms
    rooms: roomsModule.rooms,
    currentRoom: roomsModule.currentRoom,
    isLoadingRooms: roomsModule.isLoadingRooms,

    // State — Messages
    messages: messagesModule.messages,
    pinnedMessages: messagesModule.pinnedMessages,
    isLoadingMessages: messagesModule.isLoadingMessages,
    isSending: messagesModule.isSending,
    hasMoreMessages: messagesModule.hasMoreMessages,
    error: messagesModule.error,

    // State — Moderation
    moderators: moderationModule.moderators,
    currentUserRole: moderationModule.currentUserRole,
    isMuted: moderationModule.isMuted,
    mutedUntil: moderationModule.mutedUntil,

    // State — Typing
    typingUsers: typingModule.typingUsers,

    // State — Presence
    onlineUsers: presenceModule.onlineUsers,
    onlineCount: presenceModule.onlineCount,

    // Actions — Rooms
    loadRooms: roomsModule.loadRooms,
    selectRoom,
    markAsRead: roomsModule.markAsRead,

    // Actions — Messages
    loadMore: messagesModule.loadMore,
    sendMessage: messagesModule.sendMessage,
    retryMessage: messagesModule.retryMessage,
    uploadImage: messagesModule.uploadImage,
    togglePin: messagesModule.togglePin,
    deleteMessage: messagesModule.deleteMessage,

    // Actions — Typing
    broadcastTyping: typingModule.broadcastTyping,

    // Actions — Moderation
    isModerator: moderationModule.isModerator,
    isUserModerator: moderationModule.isUserModerator,
    muteUser: moderationModule.muteUser,
    unmuteUser: moderationModule.unmuteUser,
    reportMessage: moderationModule.reportMessage,
    setMemberRole: moderationModule.setMemberRole,
    loadModerators: moderationModule.loadModerators,

    // Actions — Realtime
    unsubscribe,
  }
}
