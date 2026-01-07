import { createClient } from '@supabase/supabase-js'

interface SessionRequest {
  chatId?: number
  userId?: number
  guestName?: string
  guestContact?: string
}

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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<SessionRequest>(event)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Если есть chatId - пробуем восстановить существующий чат
  if (body.chatId) {
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', body.chatId)
      .in('status', ['active', 'waiting'])
      .single()

    if (existingChat) {
      return {
        session: existingChat as Chat,
        isNew: false
      }
    }
    // Если чат не найден или закрыт - продолжаем создание нового
  }

  // Если есть userId - ищем активную сессию
  if (body.userId) {
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', body.userId)
      .in('status', ['active', 'waiting'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingChat) {
      return {
        session: existingChat as Chat,
        isNew: false
      }
    }
  }

  // Создаём новый чат
  const chatData: Record<string, unknown> = {
    status: 'waiting'  // Сразу в ожидании оператора
  }

  if (body.userId) {
    chatData.user_id = body.userId
  } else {
    // Гостевая сессия - нужны контактные данные
    if (!body.guestName?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Укажите имя'
      })
    }
    chatData.guest_name = body.guestName.trim()
    chatData.guest_contact = body.guestContact?.trim() || null
  }

  const { data: newChat, error } = await supabase
    .from('chats')
    .insert(chatData)
    .select()
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании чата'
    })
  }

  return {
    session: newChat as Chat,
    isNew: true
  }
})
