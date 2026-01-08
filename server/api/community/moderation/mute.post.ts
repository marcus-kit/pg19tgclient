// POST /api/community/moderation/mute
// Замутить пользователя в комнате на определённое время

import type { MuteUserRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const body = await readBody<MuteUserRequest>(event)

  if (!body.roomId || !body.userId || !body.duration) {
    throw createError({ statusCode: 400, message: 'roomId, userId и duration обязательны' })
  }

  if (body.duration < 1 || body.duration > 10080) { // max 7 дней
    throw createError({ statusCode: 400, message: 'Длительность должна быть от 1 до 10080 минут (7 дней)' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Нельзя мутить себя
  if (body.userId === sessionUser.id) {
    throw createError({ statusCode: 400, message: 'Нельзя замутить себя' })
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

  // Проверяем что цель не админ
  const { data: targetUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', body.userId)
    .single()

  if (targetUser?.role === 'admin') {
    throw createError({ statusCode: 403, message: 'Нельзя замутить администратора' })
  }

  // Вычисляем время окончания мута
  const expiresAt = new Date(Date.now() + body.duration * 60 * 1000).toISOString()

  // Создаём/обновляем мут
  const { error } = await supabase
    .from('community_mutes')
    .upsert({
      room_id: body.roomId,
      user_id: body.userId,
      muted_by: sessionUser.id,
      reason: body.reason || null,
      expires_at: expiresAt
    }, { onConflict: 'room_id,user_id' })

  if (error) {
    console.error('Error muting user:', error)
    throw createError({ statusCode: 500, message: 'Ошибка создания мута' })
  }

  return { success: true, expiresAt }
})
