import type {
  CommunityRoom,
  CommunityMessage,
  CommunityMemberRole,
  CommunityModerator,
  CommunityReportReason,
  CommunityContentType,
  GetRoomsResponse,
  GetMessagesResponse,
  GetMyRoleResponse,
  GetModeratorsResponse,
  SendMessageResponse
} from '~/types/community'

export function useCommunityChat() {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // State
  const rooms = ref<CommunityRoom[]>([])
  const currentRoom = ref<CommunityRoom | null>(null)
  const messages = ref<CommunityMessage[]>([])
  const pinnedMessages = ref<CommunityMessage[]>([])
  const moderators = ref<CommunityModerator[]>([])

  const isLoadingRooms = ref(false)
  const isLoadingMessages = ref(false)
  const isSending = ref(false)
  const hasMoreMessages = ref(true)
  const error = ref<string | null>(null)

  // Кэш ролей и статуса мута (с LRU-подобным поведением)
  const userRolesCache = ref<Map<string, CommunityMemberRole>>(new Map())
  const USER_ROLES_CACHE_MAX = 100 // Максимум записей в кэше ролей
  const currentUserRole = ref<CommunityMemberRole>('member')
  const isMuted = ref(false)
  const mutedUntil = ref<string | null>(null)

  // Typing indicators
  const typingUsers = ref<Map<string, { name: string; timestamp: number }>>(new Map())
  let typingCleanupInterval: ReturnType<typeof setInterval> | null = null
  let typingEmptyCycles = 0 // Счётчик пустых циклов для graceful stop
  let lastTypingBroadcast = 0
  const TYPING_DEBOUNCE = 2000 // Отправляем typing не чаще 2 сек
  const TYPING_TIMEOUT = 3000 // Считаем что перестали печатать через 3 сек
  const TYPING_CLEANUP_INTERVAL = 2000 // Интервал очистки (было 1000)
  const MAX_TYPING_USERS = 10 // Максимум пользователей в индикаторе (защита от memory leak)
  const TYPING_EMPTY_CYCLES_TO_STOP = 5 // Ждём N пустых циклов перед остановкой (10 сек)

  // Presence (онлайн пользователи)
  interface PresenceUser {
    id: string
    name: string
    avatar?: string | null
  }
  const onlineUsers = ref<Map<string, PresenceUser>>(new Map())
  const onlineCount = computed(() => onlineUsers.value.size)

  let channel: ReturnType<typeof supabase.channel> | null = null
  let roomsChannel: ReturnType<typeof supabase.channel> | null = null
  let hasSubscribedOnce = false // Флаг для отличия reconnect от первого подключения

  // Set для дедупликации сообщений, полученных через Broadcast
  // (чтобы не дублировать при получении через postgres_changes)
  const receivedViaBroadcast = new Set<string | number>()
  const RECEIVED_VIA_BROADCAST_MAX = 500 // Максимальный размер Set (защита от memory leak)

  // Периодическая очистка receivedViaBroadcast
  let broadcastCleanupInterval: ReturnType<typeof setInterval> | null = null
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

  // Отправить broadcast о наборе текста (с debounce)
  function broadcastTyping() {
    if (!channel || !currentRoom.value || !authStore.user) return

    const now = Date.now()
    if (now - lastTypingBroadcast < TYPING_DEBOUNCE) return

    lastTypingBroadcast = now

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: authStore.user.id,
        name: authStore.user.firstName || 'Пользователь',
        roomId: currentRoom.value.id
      }
    })
  }

  // Обработчик входящих typing событий
  function handleTypingBroadcast(payload: { userId: string; name: string; roomId: string }) {
    // Игнорируем свои события
    if (payload.userId === authStore.user?.id) return
    // Игнорируем события из других комнат
    if (payload.roomId !== currentRoom.value?.id) return

    // Лимит на количество (защита от memory leak в больших комнатах)
    if (typingUsers.value.size >= MAX_TYPING_USERS && !typingUsers.value.has(payload.userId)) {
      // Удаляем самую старую запись
      let oldestKey: string | null = null
      let oldestTime = Infinity
      for (const [key, data] of typingUsers.value) {
        if (data.timestamp < oldestTime) {
          oldestTime = data.timestamp
          oldestKey = key
        }
      }
      if (oldestKey) typingUsers.value.delete(oldestKey)
    }

    typingUsers.value.set(payload.userId, {
      name: payload.name,
      timestamp: Date.now()
    })

    // Запускаем очистку если ещё не запущена
    startTypingCleanup()
  }

  // Периодическая очистка неактивных typing
  function startTypingCleanup() {
    if (typingCleanupInterval) return

    typingEmptyCycles = 0 // Сброс счётчика при старте

    typingCleanupInterval = setInterval(() => {
      const now = Date.now()
      let hasActive = false

      for (const [userId, data] of typingUsers.value) {
        if (now - data.timestamp > TYPING_TIMEOUT) {
          typingUsers.value.delete(userId)
        } else {
          hasActive = true
        }
      }

      // Graceful stop: ждём несколько пустых циклов перед остановкой
      // (чтобы не перезапускать интервал при каждом новом typing)
      if (!hasActive) {
        typingEmptyCycles++
        if (typingEmptyCycles >= TYPING_EMPTY_CYCLES_TO_STOP && typingCleanupInterval) {
          clearInterval(typingCleanupInterval)
          typingCleanupInterval = null
          typingEmptyCycles = 0
        }
      } else {
        typingEmptyCycles = 0 // Сброс при активности
      }
    }, TYPING_CLEANUP_INTERVAL)
  }

  // Остановить очистку typing
  function stopTypingCleanup() {
    if (typingCleanupInterval) {
      clearInterval(typingCleanupInterval)
      typingCleanupInterval = null
    }
    typingUsers.value.clear()
  }

  // Синхронизация Presence state
  function syncPresenceState() {
    if (!channel) return

    const state = channel.presenceState<PresenceUser>()
    // Полная замена Map вместо clear+set (оптимизация для Vue reactivity)
    const newMap = new Map<string, PresenceUser>()

    for (const [_key, presences] of Object.entries(state)) {
      for (const presence of presences as PresenceUser[]) {
        // Используем id как ключ для дедупликации
        newMap.set(String(presence.id), presence)
      }
    }

    onlineUsers.value = newMap
  }

  // Track текущего пользователя в комнате
  async function trackPresence() {
    if (!channel || !authStore.user) return

    await channel.track({
      id: authStore.user.id,
      name: authStore.user.firstName || 'Пользователь',
      avatar: authStore.user.avatar
    })
  }

  // Untrack при выходе из комнаты
  async function untrackPresence() {
    if (!channel) return
    await channel.untrack()
    onlineUsers.value.clear()
  }

  // Загрузить список комнат
  async function loadRooms() {
    isLoadingRooms.value = true
    error.value = null

    try {
      const response = await $fetch<GetRoomsResponse>('/api/community/rooms')
      rooms.value = response.rooms

      // Подписываемся на изменения в комнатах (для обновления счётчиков)
      await subscribeToRoomsUpdates()
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка загрузки комнат'
      throw e
    } finally {
      isLoadingRooms.value = false
    }
  }

  // Подписка на обновления комнат (members_count и т.д.)
  async function subscribeToRoomsUpdates() {
    // Отписываемся от предыдущего канала
    if (roomsChannel) {
      await supabase.removeChannel(roomsChannel)
      roomsChannel = null
    }

    roomsChannel = supabase
      .channel('community_rooms_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_rooms'
        },
        (payload) => {
          const updated = payload.new as any
          const idx = rooms.value.findIndex(r => r.id === updated.id)
          if (idx !== -1) {
            rooms.value[idx] = {
              ...rooms.value[idx],
              membersCount: updated.members_count,
              messagesCount: updated.messages_count
            }
          }
        }
      )
      .subscribe()
  }

  // Отписка от обновлений комнат
  async function unsubscribeFromRooms() {
    if (roomsChannel) {
      await supabase.removeChannel(roomsChannel)
      roomsChannel = null
    }
  }

  // Вступить в комнату (auto-join)
  async function joinRoom(roomId: number) {
    try {
      await $fetch(`/api/community/rooms/${roomId}/join`, { method: 'POST' })
    } catch {
      // Игнорируем ошибки - не критично
    }
  }

  // Выбрать комнату и загрузить сообщения
  async function selectRoom(room: CommunityRoom) {
    // Отписываемся от предыдущей комнаты
    await unsubscribe()

    currentRoom.value = room
    messages.value = []
    pinnedMessages.value = []
    moderators.value = []
    hasMoreMessages.value = true

    // Автоматически вступаем в комнату (обновляет members_count)
    await joinRoom(room.id)

    // Загружаем данные параллельно
    await Promise.all([
      loadMessages(),
      loadPinnedMessages(),
      loadUserRole(room.id),
      loadModerators(room.id)
    ])

    await subscribe()

    // Отмечаем как прочитанное
    await markAsRead()
  }

  // Загрузить роль пользователя в комнате
  async function loadUserRole(roomId: number) {
    try {
      const response = await $fetch<GetMyRoleResponse>(`/api/community/rooms/${roomId}/my-role`)
      currentUserRole.value = response.role
      isMuted.value = response.isMuted
      mutedUntil.value = response.mutedUntil

      // LRU-подобная очистка: удаляем старые записи при превышении лимита
      if (userRolesCache.value.size >= USER_ROLES_CACHE_MAX) {
        // Map сохраняет порядок вставки, удаляем первую (самую старую) запись
        const firstKey = userRolesCache.value.keys().next().value
        if (firstKey !== undefined) {
          userRolesCache.value.delete(firstKey)
        }
      }
      userRolesCache.value.set(roomId, response.role)
    } catch {
      currentUserRole.value = 'member'
      isMuted.value = false
      mutedUntil.value = null
    }
  }

  // Загрузить модераторов комнаты
  async function loadModerators(roomId: number) {
    try {
      const response = await $fetch<GetModeratorsResponse>('/api/community/moderation/moderators', {
        query: { roomId }
      })
      moderators.value = response.moderators
    } catch {
      moderators.value = []
    }
  }

  // Отметить комнату как прочитанную
  async function markAsRead() {
    if (!currentRoom.value) return

    try {
      await $fetch('/api/community/rooms/mark-read', {
        method: 'POST',
        body: { roomId: currentRoom.value.id }
      })
    } catch {
      // Игнорируем ошибки
    }
  }

  // Загрузить сообщения (с пагинацией)
  async function loadMessages(before?: number) {
    if (!currentRoom.value) return

    isLoadingMessages.value = true

    try {
      const query: Record<string, string | number> = {
        roomId: currentRoom.value.id,
        limit: 50
      }
      if (before) query.before = before

      const response = await $fetch<GetMessagesResponse>('/api/community/messages', { query })

      if (before) {
        // Подгружаем историю - добавляем в начало
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

  // Загрузить больше (для infinite scroll)
  async function loadMore() {
    if (!hasMoreMessages.value || isLoadingMessages.value) return

    const oldestMessage = messages.value[0]
    if (oldestMessage) {
      await loadMessages(oldestMessage.id)
    }
  }

  // Загрузить закреплённые сообщения
  async function loadPinnedMessages() {
    if (!currentRoom.value) return

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: { roomId: currentRoom.value.id, pinned: 'true' }
      })
      pinnedMessages.value = response.messages
    } catch {
      // Игнорируем ошибки закреплённых
    }
  }

  // Отправить сообщение (с optimistic UI)
  async function sendMessage(content: string, options?: {
    imageUrl?: string
    imageWidth?: number
    imageHeight?: number
    replyToId?: number
  }): Promise<CommunityMessage | null> {
    if (!currentRoom.value || !authStore.user) return null
    if (!content.trim() && !options?.imageUrl) return null

    // 1. Создаём временное сообщение для мгновенного отображения
    const tempId = `temp-${Date.now()}`
    const contentType: CommunityContentType = options?.imageUrl ? 'image' : 'text'

    // Находим оригинальное сообщение для reply preview
    const replyToMessage = options?.replyToId
      ? messages.value.find(m => m.id === options.replyToId || m.id === String(options.replyToId))
      : null

    const optimisticMessage: CommunityMessage = {
      id: tempId,
      roomId: currentRoom.value.id,
      userId: authStore.user.id,
      content: content.trim(),
      contentType,
      imageUrl: options?.imageUrl || null,
      imageWidth: options?.imageWidth || null,
      imageHeight: options?.imageHeight || null,
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      replyToId: options?.replyToId ? String(options.replyToId) : null,
      replyTo: replyToMessage ? {
        id: replyToMessage.id,
        content: replyToMessage.content,
        user: replyToMessage.user
      } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sending',
      user: {
        id: authStore.user.id,
        firstName: authStore.user.firstName || 'Пользователь',
        lastName: authStore.user.lastName || '',
        avatar: authStore.user.avatar || null
      }
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
          imageUrl: options?.imageUrl,
          imageWidth: options?.imageWidth,
          imageHeight: options?.imageHeight,
          replyToId: options?.replyToId
        }
      })

      // 4. Добавляем ID в set дедупликации чтобы postgres_changes не создал дубликат
      receivedViaBroadcast.add(response.message.id)

      // 5. Удаляем temp-сообщение
      const tempIdx = messages.value.findIndex(m => m.id === tempId)
      if (tempIdx !== -1) {
        messages.value.splice(tempIdx, 1)
      }

      // 6. Проверяем, не было ли уже добавлено через realtime (race condition)
      const existingIdx = messages.value.findIndex(m => m.id === response.message.id)
      if (existingIdx === -1) {
        // Добавляем реальное сообщение, сохраняя replyTo из optimistic (сервер его не возвращает)
        messages.value.push({
          ...response.message,
          replyTo: replyToMessage ? {
            id: replyToMessage.id,
            content: replyToMessage.content,
            user: replyToMessage.user
          } : null,
          status: 'sent'
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

  // Повторить отправку failed сообщения
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
      imageHeight: msg.imageHeight || undefined
    })
  }

  // Загрузить изображение
  async function uploadImage(file: File): Promise<{ url: string; width: number; height: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ url: string; width: number; height: number }>(
      '/api/community/upload/image',
      { method: 'POST', body: formData }
    )

    return response
  }

  // Закрепить/открепить сообщение (для модераторов)
  async function togglePin(messageId: number) {
    const response = await $fetch<{ success: boolean; isPinned: boolean }>(
      `/api/community/messages/${messageId}/pin`,
      { method: 'POST' }
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

  // Удалить сообщение (для модераторов или автора)
  async function deleteMessage(messageId: number) {
    await $fetch(`/api/community/messages/${messageId}/delete`, {
      method: 'POST'
    })

    // Обновляем локально
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx],
        isDeleted: true,
        content: 'Сообщение удалено'
      }
    }
  }

  // Realtime подписка
  async function subscribe() {
    if (!currentRoom.value) return

    // Отписываемся от предыдущего канала
    if (channel) {
      await supabase.removeChannel(channel)
      channel = null
    }

    // Очищаем typing при смене комнаты
    stopTypingCleanup()

    // Запускаем периодическую очистку receivedViaBroadcast
    startBroadcastCleanup()

    channel = supabase
      .channel(`community:${currentRoom.value.id}`)
      // Broadcast для typing indicators
      .on(
        'broadcast',
        { event: 'typing' },
        ({ payload }) => handleTypingBroadcast(payload)
      )
      // Broadcast для мгновенной доставки новых сообщений
      .on(
        'broadcast',
        { event: 'new_message' },
        ({ payload }) => {
          const message = payload as CommunityMessage

          // Игнорируем свои сообщения (уже есть через optimistic UI)
          if (message.userId === authStore.user?.id) return

          // Игнорируем если уже получили
          if (messages.value.some(m => m.id === message.id)) return

          // Если есть replyToId, но нет replyTo — находим в локальных сообщениях
          if (message.replyToId && !message.replyTo) {
            const replyMsg = messages.value.find(
              m => m.id === message.replyToId || m.id === Number(message.replyToId)
            )
            if (replyMsg) {
              message.replyTo = {
                id: replyMsg.id,
                content: replyMsg.content,
                user: replyMsg.user
              }
            }
          }

          // Добавляем и помечаем как полученное через Broadcast
          receivedViaBroadcast.add(message.id)
          messages.value.push(message)

          // Убираем typing для автора
          typingUsers.value.delete(message.userId)

          // Уведомление
          playNotificationSound()
        }
      )
      // postgres_changes для сообщений (fallback)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `room_id=eq.${currentRoom.value.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Если уже получили через Broadcast — игнорируем
          if (receivedViaBroadcast.has(newMessage.id)) {
            receivedViaBroadcast.delete(newMessage.id) // Очищаем
            return
          }

          // Проверяем дубликат
          if (!messages.value.find(m => m.id === newMessage.id)) {
            // Загружаем полное сообщение с user
            await loadSingleMessage(newMessage.id)
          }

          // Убираем typing для автора сообщения
          typingUsers.value.delete(newMessage.user_id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
          filter: `room_id=eq.${currentRoom.value.id}`
        },
        (payload) => {
          const updated = payload.new as any
          const idx = messages.value.findIndex(m => m.id === updated.id)
          if (idx !== -1) {
            messages.value[idx] = {
              ...messages.value[idx],
              isDeleted: updated.is_deleted,
              isPinned: updated.is_pinned,
              content: updated.is_deleted ? 'Сообщение удалено' : updated.content
            }
          }
        }
      )
      // Presence для онлайн пользователей
      .on('presence', { event: 'sync' }, () => {
        syncPresenceState()
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const presence of newPresences as PresenceUser[]) {
          onlineUsers.value.set(String(presence.id), presence)
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const presence of leftPresences as PresenceUser[]) {
          onlineUsers.value.delete(String(presence.id))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Начинаем tracking после успешной подписки
          await trackPresence()

          // Дозагружаем пропущенные сообщения ТОЛЬКО при reconnect (не при первом подключении)
          if (hasSubscribedOnce && messages.value.length > 0) {
            const lastRealMessage = messages.value
              .filter(m => !String(m.id).startsWith('temp-'))
              .at(-1)
            if (lastRealMessage) {
              await loadMessagesSince(lastRealMessage.id)
            }
          }
          hasSubscribedOnce = true
        }
      })
  }

  // Загрузить одно сообщение (для Realtime)
  async function loadSingleMessage(id: number) {
    if (!currentRoom.value) return

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: { roomId: currentRoom.value.id, ids: String(id) }
      })

      const msg = response.messages[0]
      if (msg && !messages.value.find(m => m.id === msg.id)) {
        messages.value.push(msg)

        // Уведомление если не от текущего пользователя
        if (msg.userId !== authStore.user?.id) {
          playNotificationSound()
        }
      }
    } catch {
      // Игнорируем
    }
  }

  // Загрузить сообщения после указанного ID (для reconnect)
  async function loadMessagesSince(afterId: string | number) {
    if (!currentRoom.value) return

    try {
      const response = await $fetch<GetMessagesResponse>('/api/community/messages', {
        query: {
          roomId: currentRoom.value.id,
          after: afterId,
          limit: 100
        }
      })

      // Добавляем только новые (дедупликация)
      const existingIds = new Set(messages.value.map(m => m.id))
      const newMessages = response.messages.filter(m => !existingIds.has(m.id))

      if (newMessages.length > 0) {
        messages.value.push(...newMessages)
        // Сортировка по дате
        messages.value.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }
    } catch {
      // Игнорируем ошибки загрузки пропущенных сообщений
    }
  }

  async function unsubscribe() {
    stopTypingCleanup()
    stopBroadcastCleanup() // Останавливаем очистку receivedViaBroadcast
    hasSubscribedOnce = false // Сбрасываем флаг reconnect
    await untrackPresence()
    if (channel) {
      await supabase.removeChannel(channel)
      channel = null
    }
  }

  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch {
      // Игнорируем ошибки
    }
  }

  // Проверка роли модератора
  function isModerator(roomId?: number): boolean {
    // Сначала проверяем глобальную роль admin
    if (authStore.user?.role === 'admin') return true

    // Затем проверяем роль в конкретной комнате
    const rid = roomId || currentRoom.value?.id
    if (rid) {
      const role = userRolesCache.value.get(rid)
      return role === 'moderator' || role === 'admin'
    }

    // Или текущую загруженную роль
    return currentUserRole.value === 'moderator' || currentUserRole.value === 'admin'
  }

  // Проверка, является ли пользователь модератором комнаты
  function isUserModerator(userId: number): boolean {
    return moderators.value.some(m => m.userId === userId)
  }

  // Замутить пользователя
  async function muteUser(userId: number, duration: number, reason?: string) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/mute', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId,
        duration,
        reason
      }
    })
  }

  // Снять мут
  async function unmuteUser(userId: number) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/unmute', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId
      }
    })
  }

  // Пожаловаться на сообщение
  async function reportMessage(messageId: number, reason: CommunityReportReason, details?: string) {
    await $fetch(`/api/community/messages/${messageId}/report`, {
      method: 'POST',
      body: { reason, details }
    })
  }

  // Назначить роль пользователю (только global admin)
  async function setMemberRole(userId: number, role: CommunityMemberRole) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/set-role', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId,
        role
      }
    })

    // Перезагружаем модераторов
    await loadModerators(currentRoom.value.id)
  }

  // Очистка при размонтировании
  onUnmounted(() => {
    void unsubscribe()
    void unsubscribeFromRooms()
  })

  return {
    // State
    rooms,
    currentRoom,
    messages,
    pinnedMessages,
    moderators,
    isLoadingRooms,
    isLoadingMessages,
    isSending,
    hasMoreMessages,
    error,
    currentUserRole,
    isMuted,
    mutedUntil,
    typingUsers,
    onlineUsers,
    onlineCount,

    // Actions
    loadRooms,
    selectRoom,
    loadMore,
    sendMessage,
    retryMessage,
    uploadImage,
    togglePin,
    deleteMessage,
    unsubscribe,
    markAsRead,
    broadcastTyping,

    // Роли и модерация
    isModerator,
    isUserModerator,
    muteUser,
    unmuteUser,
    reportMessage,
    setMemberRole,
    loadModerators
  }
}
