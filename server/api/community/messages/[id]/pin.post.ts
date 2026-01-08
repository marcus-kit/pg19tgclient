// POST /api/community/messages/:id/pin
// Закрепить/открепить сообщение (для модераторов)

export default defineEventHandler(async (event) => {
  const messageId = Number(getRouterParam(event, 'id'))

  if (!messageId) {
    throw createError({ statusCode: 400, message: 'ID сообщения обязателен' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем сообщение
  const { data: message } = await supabase
    .from('community_messages')
    .select('id, room_id, is_pinned')
    .eq('id', messageId)
    .single()

  if (!message) {
    throw createError({ statusCode: 404, message: 'Сообщение не найдено' })
  }

  // Проверяем права модератора
  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('room_id', message.room_id)
    .eq('user_id', sessionUser.id)
    .single()

  // Также проверяем глобальную роль admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', sessionUser.id)
    .single()

  const isAdmin = user?.role === 'admin'
  const isModerator = membership?.role === 'moderator' || membership?.role === 'admin'

  if (!isAdmin && !isModerator) {
    throw createError({ statusCode: 403, message: 'Нет прав для этого действия' })
  }

  // Переключаем статус закрепления
  const { error } = await supabase
    .from('community_messages')
    .update({ is_pinned: !message.is_pinned })
    .eq('id', messageId)

  if (error) {
    console.error('Error pinning message:', error)
    throw createError({ statusCode: 500, message: 'Ошибка обновления' })
  }

  return { success: true, isPinned: !message.is_pinned }
})
