// POST /api/community/rooms/mark-read
// Отметить комнату как прочитанную

import type { MarkReadRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const body = await readBody<MarkReadRequest>(event)

  if (!body.roomId) {
    throw createError({ statusCode: 400, message: 'roomId обязателен' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Вызываем функцию обновления last_read_at
  const { error } = await supabase.rpc('update_community_last_read', {
    p_room_id: body.roomId,
    p_user_id: sessionUser.id
  })

  if (error) {
    console.error('Error marking as read:', error)
    throw createError({ statusCode: 500, message: 'Ошибка обновления' })
  }

  return { success: true }
})
