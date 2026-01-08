import { createClient } from '@supabase/supabase-js'

interface CloseRequest {
  chatId: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CloseRequest>(event)

  if (!body.chatId) {
    throw createError({
      statusCode: 400,
      message: 'chatId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Проверяем чат
  const { data: chat } = await supabase
    .from('chats')
    .select('id, status')
    .eq('id', body.chatId)
    .single()

  if (!chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  if (chat.status === 'closed') {
    return { success: true, message: 'Чат уже закрыт' }
  }

  // Закрываем чат
  const { error } = await supabase
    .from('chats')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', body.chatId)

  if (error) {
    console.error('Error closing chat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при закрытии чата'
    })
  }

  return { success: true, message: 'Чат закрыт' }
})
