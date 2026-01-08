// GET /api/community/rooms/:id/my-role
// Моя роль в комнате

import type { GetMyRoleResponse } from '~/types/community'

export default defineEventHandler(async (event): Promise<GetMyRoleResponse> => {
  const roomId = Number(getRouterParam(event, 'id'))

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'ID комнаты обязателен' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем роль пользователя
  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', sessionUser.id)
    .single()

  const role = membership?.role || 'member'

  // Проверяем мут
  const { data: muteData } = await supabase.rpc('check_community_mute', {
    p_room_id: roomId,
    p_user_id: sessionUser.id
  })

  const muteInfo = muteData?.[0] || { is_muted: false, expires_at: null }

  return {
    role: role as 'member' | 'moderator' | 'admin',
    isMuted: muteInfo.is_muted,
    mutedUntil: muteInfo.expires_at
  }
})
