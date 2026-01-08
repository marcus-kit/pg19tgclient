// POST /api/community/messages/:id/delete
// Удалить сообщение (мягкое удаление, для модераторов или автора)

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
    .select('id, room_id, user_id, is_deleted')
    .eq('id', messageId)
    .single()

  if (!message) {
    throw createError({ statusCode: 404, message: 'Сообщение не найдено' })
  }

  if (message.is_deleted) {
    throw createError({ statusCode: 400, message: 'Сообщение уже удалено' })
  }

  // Проверяем права
  const isAuthor = message.user_id === sessionUser.id

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

  if (!isAuthor && !isAdmin && !isModerator) {
    throw createError({ statusCode: 403, message: 'Нет прав для удаления' })
  }

  // Мягкое удаление
  const { error } = await supabase
    .from('community_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: sessionUser.id
    })
    .eq('id', messageId)

  if (error) {
    console.error('Error deleting message:', error)
    throw createError({ statusCode: 500, message: 'Ошибка удаления' })
  }

  return { success: true }
})
