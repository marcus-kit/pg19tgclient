export default defineEventHandler(async (event) => {
  // Проверяем авторизацию - userId берём из сессии
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'sessionId обязателен'
    })
  }

  const supabase = useSupabaseServer()

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

  if (session.user_id !== userId) {
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
