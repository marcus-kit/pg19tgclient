// POST /api/user/presence
// Heartbeat для обновления онлайн-статуса пользователя
// Вызывается клиентом каждые 30-60 секунд

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  const body = await readBody<{ status?: 'online' | 'away' }>(event)
  const status = body?.status || 'online'

  // Валидация статуса
  if (!['online', 'away'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Неверный статус' })
  }

  // Обновляем статус и время последней активности
  const { error } = await supabase
    .from('users')
    .update({
      online_status: status,
      last_seen_at: new Date().toISOString()
    })
    .eq('id', sessionUser.id)

  if (error) {
    console.error('Error updating presence:', error)
    throw createError({ statusCode: 500, message: 'Ошибка обновления статуса' })
  }

  return { success: true, status }
})
