// GET /api/community/moderation/moderators?roomId=X
// Список модераторов комнаты

import type { GetModeratorsResponse } from '~/types/community'

export default defineEventHandler(async (event): Promise<GetModeratorsResponse> => {
  const query = getQuery(event)
  const roomId = Number(query.roomId)

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId обязателен' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем модераторов и админов комнаты
  const { data: members, error } = await supabase
    .from('community_members')
    .select(`
      user_id,
      role,
      user:users!community_members_user_id_fkey(
        id, first_name, last_name, nickname, avatar
      )
    `)
    .eq('room_id', roomId)
    .in('role', ['moderator', 'admin'])

  if (error) {
    console.error('Error fetching moderators:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки модераторов' })
  }

  const moderators = (members || []).map(m => {
    const user = m.user as any
    const displayName = user?.nickname || user?.first_name || 'Пользователь'
    return {
      userId: m.user_id,
      displayName,
      avatar: user?.avatar || null,
      role: m.role as 'moderator' | 'admin'
    }
  })

  return { moderators }
})
