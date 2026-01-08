// POST /api/community/moderation/unmute
// Снять мут с пользователя

import type { UnmuteUserRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const body = await readBody<UnmuteUserRequest>(event)

  if (!body.roomId || !body.userId) {
    throw createError({ statusCode: 400, message: 'roomId и userId обязательны' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Проверяем права модератора
  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('room_id', body.roomId)
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

  // Удаляем мут
  const { error } = await supabase
    .from('community_mutes')
    .delete()
    .eq('room_id', body.roomId)
    .eq('user_id', body.userId)

  if (error) {
    console.error('Error unmuting user:', error)
    throw createError({ statusCode: 500, message: 'Ошибка снятия мута' })
  }

  return { success: true }
})
