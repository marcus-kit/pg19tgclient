import { getCookie } from 'h3'

const CHAT_SESSION_COOKIE = 'pg19_chat_session'

interface ChatMessage {
  id: string
  chat_id: string
  sender_type: 'user' | 'admin' | 'system'
  sender_id: string | null
  sender_name: string | null
  content: string
  content_type: string
  is_read: boolean
  created_at: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const chatId = query.chatId as string
  if (!chatId) {
    throw createError({
      statusCode: 400,
      message: 'chatId обязателен'
    })
  }

  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0

  const supabase = useSupabaseServer()

  // Получаем чат с полной информацией для проверки ownership
  const { data: chat } = await supabase
    .from('chats')
    .select('id, user_id, session_token, status')
    .eq('id', chatId)
    .single()

  if (!chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  // Проверяем ownership
  const sessionUser = await getUserFromSession(event)
  const chatSessionToken = getCookie(event, CHAT_SESSION_COOKIE)

  if (chat.user_id) {
    // Чат авторизованного пользователя
    if (!sessionUser || sessionUser.id !== chat.user_id) {
      throw createError({
        statusCode: 403,
        message: 'Нет доступа к этому чату'
      })
    }
  } else {
    // Гостевой чат - проверяем токен
    if (!chatSessionToken || chatSessionToken !== chat.session_token) {
      throw createError({
        statusCode: 403,
        message: 'Нет доступа к этому чату'
      })
    }
  }

  // Получаем сообщения
  const { data: messages, error, count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact' })
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching messages:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении сообщений'
    })
  }

  return {
    messages: messages as ChatMessage[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit
  }
})
