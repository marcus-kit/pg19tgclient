import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Chat, ChatMessage, SessionRequest, SessionResponse, MessagesResponse } from '~/types/chat'

export function useChat() {
  const supabase = useSupabaseClient()
  const chatStore = useChatStore()

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

      // Отписываемся от старой подписки и создаём новую
      unsubscribe()
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

      // Обновляем статус через spread для реактивности
      if (session.value) {
        session.value = { ...session.value, status: 'closed' }
      }
    } catch (e) {
      console.error('Error closing chat:', e)
    } finally {
      // Всегда отписываемся, даже при ошибке
      unsubscribe()
    }
  }

  // Подписка на Realtime
  function subscribe() {
    if (!session.value) return

    // Отписываемся от предыдущего канала (защита от race condition)
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }

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
            // Для сообщений не от пользователя: звук + счётчик
            if (newMessage.sender_type !== 'user') {
              playNotificationSound()
              chatStore.incrementUnread()
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
