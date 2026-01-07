import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const userId = body?.userId

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'sessionId обязателен'
    })
  }

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Проверяем, что сессия принадлежит пользователю
  const { data: session, error: fetchError } = await supabase
    .from('auth_sessions')
    .select('id, user_id, is_current')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    throw createError({
      statusCode: 404,
      message: 'Сессия не найдена'
    })
  }

  if (session.user_id !== parseInt(userId)) {
    throw createError({
      statusCode: 403,
      message: 'Нет доступа к этой сессии'
    })
  }

  if (session.is_current) {
    throw createError({
      statusCode: 400,
      message: 'Нельзя завершить текущую сессию'
    })
  }

  // Завершаем сессию (soft delete)
  const { error } = await supabase
    .from('auth_sessions')
    .update({ terminated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    console.error('Error terminating session:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при завершении сессии'
    })
  }

  return { success: true }
})
