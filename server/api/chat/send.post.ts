import { createClient } from '@supabase/supabase-js'

interface SendRequest {
  chatId: number
  message: string
  senderType?: 'user' | 'admin'
  senderId?: number
  senderName?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<SendRequest>(event)

  if (!body.chatId) {
    throw createError({
      statusCode: 400,
      message: 'chatId обязателен'
    })
  }

  if (!body.message?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Сообщение не может быть пустым'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Проверяем чат
  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', body.chatId)
    .single()

  if (!chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  if (chat.status === 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Чат закрыт'
    })
  }

  // Сохраняем сообщение
  const senderType = body.senderType || 'user'
  const { data: newMessage, error: msgError } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: body.chatId,
      sender_type: senderType,
      sender_id: body.senderId || chat.user_id || 0,
      sender_name: body.senderName || chat.guest_name || chat.user_name,
      content: body.message.trim(),
      content_type: 'text'
    })
    .select()
    .single()

  if (msgError) {
    console.error('Error saving message:', msgError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при сохранении сообщения'
    })
  }

  // Обновляем счётчик непрочитанных для админа
  if (senderType === 'user') {
    await supabase
      .from('chats')
      .update({
        unread_admin_count: chat.unread_admin_count + 1
      })
      .eq('id', body.chatId)
  }

  // TODO: уведомление в Telegram для операторов

  return {
    message: newMessage
  }
})
