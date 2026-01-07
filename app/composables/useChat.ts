import type { RealtimeChannel } from '@supabase/supabase-js'

interface Chat {
  id: number
  user_id: number | null
  user_name: string | null
  guest_name: string | null
  guest_contact: string | null
  status: string
  last_message_at: string | null
  unread_admin_count: number
  unread_user_count: number
  created_at: string
}

interface ChatMessage {
  id: number
  chat_id: number
  sender_type: 'user' | 'admin' | 'system'
  sender_id: number
  sender_name: string | null
  content: string
  content_type: string
  is_read: boolean
  created_at: string
}

export function useChat() {
  const supabase = useSupabaseClient()

  const session = ref<Chat | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)

  let channel: RealtimeChannel | null = null

  // Создать или получить чат
  async function initSession(options: {
    chatId?: number
    userId?: number
    guestName?: string
    guestContact?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const { session: newChat, isNew } = await $fetch<{
        session: Chat
        isNew: boolean
      }>('/api/chat/session', {
        method: 'POST',
        body: options
      })

      session.value = newChat

      // Загружаем историю сообщений
      await loadMessages()

      // Подписываемся на новые сообщения
      subscribe()

      return { session: newChat, isNew }
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка при создании чата'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Загрузить сообщения
  async function loadMessages() {
    if (!session.value) return

    try {
      const { messages: loadedMessages } = await $fetch<{
        messages: ChatMessage[]
        total: number
      }>('/api/chat/messages', {
        query: { chatId: session.value.id }
      })

      messages.value = loadedMessages
    } catch (e) {
      console.error('Error loading messages:', e)
    }
  }

  // Отправить сообщение
  async function sendMessage(text: string) {
    if (!session.value || !text.trim()) return

    isSending.value = true
    error.value = null

    try {
      const result = await $fetch<{
        message: ChatMessage
      }>('/api/chat/send', {
        method: 'POST',
        body: {
          chatId: session.value.id,
          message: text.trim()
        }
      })

      // Сообщения добавятся через Realtime, но на всякий случай
      // проверяем что их ещё нет
      if (!messages.value.find(m => m.id === result.message.id)) {
        messages.value.push(result.message)
      }

      return result
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка при отправке'
      throw e
    } finally {
      isSending.value = false
    }
  }

  // Закрыть чат
  async function closeSession() {
    if (!session.value) return

    try {
      await $fetch('/api/chat/close', {
        method: 'POST',
        body: { chatId: session.value.id }
      })

      session.value.status = 'closed'
      unsubscribe()
    } catch (e) {
      console.error('Error closing chat:', e)
    }
  }

  // Подписка на Realtime
  function subscribe() {
    if (!session.value || channel) return

    channel = supabase
      .channel(`chat:${session.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${session.value.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          // Проверяем что сообщения ещё нет (могло прийти от sendMessage)
          if (!messages.value.find(m => m.id === newMessage.id)) {
            messages.value.push(newMessage)
            // Воспроизводим звук для сообщений не от пользователя
            if (newMessage.sender_type !== 'user') {
              playNotificationSound()
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${session.value.id}`
        },
        (payload) => {
          // Обновляем статус чата
          if (session.value) {
            Object.assign(session.value, payload.new)
          }
        }
      )
      .subscribe()
  }

  // Отписка
  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  // Звук уведомления
  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Игнорируем ошибки воспроизведения
    }
  }

  // Очистка при размонтировании
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    session,
    messages,
    isLoading,
    isSending,
    error,
    initSession,
    loadMessages,
    sendMessage,
    closeSession,
    unsubscribe
  }
}
