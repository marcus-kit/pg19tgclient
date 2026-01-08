// POST /api/community/moderation/ban
// Забанить пользователя в комнате

import type { BanUserRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const body = await readBody<BanUserRequest>(event)

  if (!body.roomId || !body.userId) {
    throw createError({ statusCode: 400, message: 'roomId и userId обязательны' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Нельзя банить себя
  if (body.userId === sessionUser.id) {
    throw createError({ statusCode: 400, message: 'Нельзя забанить себя' })
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
    throw createError({ statusCode: 403, message: 'Нельзя забанить администратора' })
  }

  // Создаём бан
  const { error } = await supabase
    .from('community_bans')
    .upsert({
      room_id: body.roomId,
      user_id: body.userId,
      banned_by: sessionUser.id,
      reason: body.reason || null,
      expires_at: body.expiresAt || null
    }, { onConflict: 'room_id,user_id' })

  if (error) {
    console.error('Error banning user:', error)
    throw createError({ statusCode: 500, message: 'Ошибка создания бана' })
  }

  return { success: true }
})
