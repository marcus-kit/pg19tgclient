// ═══════════════════════════════════════════════════════════════════════════
// useCommunityMessages — CRUD сообщений чата
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CommunityRoom,
  CommunityMessage,
  CommunityContentType,
  GetMessagesResponse,
  SendMessageResponse,
} from '~/types/community'

// ═══════════════════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════════════════

const RECEIVED_VIA_BROADCAST_MAX = 500 // Максимальный размер Set дедупликации

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Данные пользователя для optimistic message */
interface MessageUser {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
}

/** Параметры composable */
interface UseCommunityMessagesOptions {
  currentRoom: Ref<CommunityRoom | null>
  user: ComputedRef<MessageUser | null>
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Управление сообщениями чата.
 *
 * Функционал:
 * - Загрузка сообщений с пагинацией
 * - Отправка с optimistic UI
 * - Retry для failed сообщений
 * - Закреплённые сообщения
 * - Удаление и pin
 *
 * @param options - Зависимости (currentRoom, user)
 */
export function useCommunityMessages(options: UseCommunityMessagesOptions) {
  const { currentRoom, user } = options

  // ═══════════════════════════════════════════════════════════════════════════
  // РЕАКТИВНОЕ СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  const messages = ref<CommunityMessage[]>([])
  const pinnedMessages = ref<CommunityMessage[]>([])
  const isLoadingMessages = ref(false)
  const isSending = ref(false)
  const hasMoreMessages = ref(true)
  const error = ref<string | null>(null)

  // Set для дедупликации сообщений, полученных через Broadcast
  const receivedViaBroadcast = new Set<string | number>()
  let broadcastCleanupInterval: ReturnType<typeof setInterval> | null = null

  // ═══════════════════════════════════════════════════════════════════════════
  // ВНУТРЕННИЕ МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Периодическая очистка receivedViaBroadcast */
  function startBroadcastCleanup() {
    if (broadcastCleanupInterval) return
    broadcastCleanupInterval = setInterval(() => {
      if (receivedViaBroadcast.size > RECEIVED_VIA_BROADCAST_MAX) {
        receivedViaBroadcast.clear()
      }
    }, 60000) // Проверяем каждую минуту
  }

  function stopBroadcastCleanup() {
    if (broadcastCleanupInterval) {
      clearInterval(broadcastCleanupInterval)
      broadcastCleanupInterval = null
    }
    receivedViaBroadcast.clear()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Загрузить сообщения (с пагинацией) */
  async function loadMessages(before?: number) {
    if (!currentRoom.value) return

    isLoadingMessages.value = true

    try {
      const query: Record<string, string | number> = {
        roomId: currentRoom.value.id,
        limit: 50,
      }
      if (before) query.before = before

      const response = await $fetch<GetMessagesResponse>('/api/community/messages', { query })

      if (before) {
        // Подгружаем историю — добавляем в начало
        messages.value = [...response.messages, ...messages.value]
      } else {
        messages.value = response.messages
      }

      hasMoreMessages.value = response.hasMore
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка загрузки сообщений'
    } finally {
      isLoadingMessages.value = false
    }
  }

  /** Загрузить больше (для infinite scroll) */
  async function loadMore() {
    if (!hasMoreMessages.value || isLoadingMessages.value) return

    const oldestMessage = messages.value[0]
    if (oldestMessage) {
      await loadMessages(Number(oldestMessage.id))
    }
  }

  /** Загрузить закреплённые сообщения */
  async function loadPinnedMessages() {
    if (!currentRoom.value) return

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: { roomId: currentRoom.value.id, pinned: 'true' },
      })
      pinnedMessages.value = response.messages
    } catch {
      // Игнорируем ошибки закреплённых
    }
  }

  /** Отправить сообщение (с optimistic UI) */
  async function sendMessage(content: string, messageOptions?: {
    imageUrl?: string
    imageWidth?: number
    imageHeight?: number
    replyToId?: number
  }): Promise<CommunityMessage | null> {
    if (!currentRoom.value || !user.value) return null
    if (!content.trim() && !messageOptions?.imageUrl) return null

    // 1. Создаём временное сообщение для мгновенного отображения
    const tempId = `temp-${Date.now()}`
    const contentType: CommunityContentType = messageOptions?.imageUrl ? 'image' : 'text'

    // Находим оригинальное сообщение для reply preview
    const replyToMessage = messageOptions?.replyToId
      ? messages.value.find(m => m.id === messageOptions.replyToId || m.id === String(messageOptions.replyToId))
      : null

    const optimisticMessage: CommunityMessage = {
      id: tempId,
      roomId: currentRoom.value.id,
      userId: user.value.id,
      content: content.trim(),
      contentType,
      imageUrl: messageOptions?.imageUrl || null,
      imageWidth: messageOptions?.imageWidth || null,
      imageHeight: messageOptions?.imageHeight || null,
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      replyToId: messageOptions?.replyToId ? String(messageOptions.replyToId) : null,
      replyTo: replyToMessage ? {
        id: replyToMessage.id,
        content: replyToMessage.content,
        user: replyToMessage.user,
      } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sending',
      user: {
        id: user.value.id,
        firstName: user.value.firstName || 'Пользователь',
        lastName: user.value.lastName || '',
        avatar: user.value.avatar || null,
      },
    }

    // 2. Добавляем в UI сразу
    messages.value.push(optimisticMessage)
    error.value = null

    // 3. Отправляем на сервер
    try {
      isSending.value = true
      const response = await $fetch<SendMessageResponse>('/api/community/messages/send', {
        method: 'POST',
        body: {
          roomId: currentRoom.value.id,
          content: content.trim(),
          contentType,
          imageUrl: messageOptions?.imageUrl,
          imageWidth: messageOptions?.imageWidth,
          imageHeight: messageOptions?.imageHeight,
          replyToId: messageOptions?.replyToId,
        },
      })

      // 4. Добавляем ID в set дедупликации
      receivedViaBroadcast.add(response.message.id)

      // 5. Удаляем temp-сообщение
      const tempIdx = messages.value.findIndex(m => m.id === tempId)
      if (tempIdx !== -1) {
        messages.value.splice(tempIdx, 1)
      }

      // 6. Проверяем, не было ли уже добавлено через realtime (race condition)
      const existingIdx = messages.value.findIndex(m => m.id === response.message.id)
      if (existingIdx === -1) {
        // Добавляем реальное сообщение, сохраняя replyTo из optimistic
        messages.value.push({
          ...response.message,
          replyTo: replyToMessage ? {
            id: replyToMessage.id,
            content: replyToMessage.content,
            user: replyToMessage.user,
          } : null,
          status: 'sent',
        })
      } else {
        // Обновляем статус если уже было добавлено
        messages.value[existingIdx] = { ...messages.value[existingIdx], status: 'sent' }
      }

      return response.message
    } catch (e: unknown) {
      // 5. Помечаем как failed
      const idx = messages.value.findIndex(m => m.id === tempId)
      if (idx !== -1) {
        messages.value[idx] = { ...messages.value[idx], status: 'failed' }
      }

      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка отправки'
      return null
    } finally {
      isSending.value = false
    }
  }

  /** Повторить отправку failed сообщения */
  async function retryMessage(tempId: string): Promise<CommunityMessage | null> {
    const msg = messages.value.find(m => m.id === tempId && m.status === 'failed')
    if (!msg) return null

    // Удаляем failed сообщение
    messages.value = messages.value.filter(m => m.id !== tempId)

    // Отправляем заново
    return sendMessage(msg.content, {
      replyToId: msg.replyToId ? Number(msg.replyToId) : undefined,
      imageUrl: msg.imageUrl || undefined,
      imageWidth: msg.imageWidth || undefined,
      imageHeight: msg.imageHeight || undefined,
    })
  }

  /** Загрузить изображение */
  async function uploadImage(file: File): Promise<{ url: string; width: number; height: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ url: string; width: number; height: number }>(
      '/api/community/upload/image',
      { method: 'POST', body: formData },
    )

    return response
  }

  /** Закрепить/открепить сообщение (для модераторов) */
  async function togglePin(messageId: number) {
    const response = await $fetch<{ success: boolean; isPinned: boolean }>(
      `/api/community/messages/${messageId}/pin`,
      { method: 'POST' },
    )

    // Обновляем локально
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], isPinned: response.isPinned }
    }

    // Перезагружаем закреплённые
    await loadPinnedMessages()

    return response
  }

  /** Удалить сообщение (для модераторов или автора) */
  async function deleteMessage(messageId: number) {
    await $fetch(`/api/community/messages/${messageId}/delete`, {
      method: 'POST',
    })

    // Обновляем локально
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx],
        isDeleted: true,
        content: 'Сообщение удалено',
      }
    }
  }

  /** Загрузить одно сообщение (для Realtime) */
  async function loadSingleMessage(id: number): Promise<CommunityMessage | null> {
    if (!currentRoom.value) return null

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: { roomId: currentRoom.value.id, ids: String(id) },
      })

      const msg = response.messages[0]
      if (msg && !messages.value.find(m => m.id === msg.id)) {
        messages.value.push(msg)
        return msg
      }
      return msg || null
    } catch {
      return null
    }
  }

  /** Загрузить сообщения после указанного ID (для reconnect) */
  async function loadMessagesSince(afterId: string | number) {
    if (!currentRoom.value) return

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: {
          roomId: currentRoom.value.id,
          after: afterId,
          limit: 100,
        },
      })

      // Добавляем только новые (дедупликация)
      const existingIds = new Set(messages.value.map(m => m.id))
      const newMessages = response.messages.filter(m => !existingIds.has(m.id))

      if (newMessages.length > 0) {
        messages.value.push(...newMessages)
        // Сортировка по дате
        messages.value.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
      }
    } catch {
      // Игнорируем ошибки загрузки пропущенных сообщений
    }
  }

  /** Добавить сообщение из Realtime (broadcast или postgres_changes) */
  function addRealtimeMessage(message: CommunityMessage) {
    // Игнорируем свои сообщения (уже есть через optimistic UI)
    if (message.userId === user.value?.id) return false

    // Игнорируем если уже получили
    if (messages.value.some(m => m.id === message.id)) return false

    // Если есть replyToId, но нет replyTo — находим в локальных сообщениях
    if (message.replyToId && !message.replyTo) {
      const replyMsg = messages.value.find(
        m => m.id === message.replyToId || m.id === Number(message.replyToId),
      )
      if (replyMsg) {
        message.replyTo = {
          id: replyMsg.id,
          content: replyMsg.content,
          user: replyMsg.user,
        }
      }
    }

    // Добавляем и помечаем как полученное через Broadcast
    receivedViaBroadcast.add(message.id)
    messages.value.push(message)
    return true
  }

  /** Обработка UPDATE события postgres_changes */
  function handleMessageUpdate(updated: { id: number; is_deleted: boolean; is_pinned: boolean; content: string }) {
    const idx = messages.value.findIndex(m => m.id === updated.id)
    if (idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx],
        isDeleted: updated.is_deleted,
        isPinned: updated.is_pinned,
        content: updated.is_deleted ? 'Сообщение удалено' : updated.content,
      }
    }
  }

  /** Проверить, было ли сообщение получено через Broadcast */
  function wasReceivedViaBroadcast(id: string | number): boolean {
    const was = receivedViaBroadcast.has(id)
    if (was) receivedViaBroadcast.delete(id) // Очищаем
    return was
  }

  /** Сбросить состояние (при смене комнаты) */
  function reset() {
    messages.value = []
    pinnedMessages.value = []
    hasMoreMessages.value = true
    error.value = null
    stopBroadcastCleanup()
  }

  /** Запустить очистку broadcast (при подписке) */
  function enableBroadcastCleanup() {
    startBroadcastCleanup()
  }

  /** Остановить всё (при отписке) */
  function cleanup() {
    stopBroadcastCleanup()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    messages,
    pinnedMessages: readonly(pinnedMessages),
    isLoadingMessages: readonly(isLoadingMessages),
    isSending: readonly(isSending),
    hasMoreMessages: readonly(hasMoreMessages),
    error,

    // Actions
    loadMessages,
    loadMore,
    loadPinnedMessages,
    sendMessage,
    retryMessage,
    uploadImage,
    togglePin,
    deleteMessage,
    loadSingleMessage,
    loadMessagesSince,
    addRealtimeMessage,
    handleMessageUpdate,
    wasReceivedViaBroadcast,
    reset,
    enableBroadcastCleanup,
    cleanup,
  }
}
