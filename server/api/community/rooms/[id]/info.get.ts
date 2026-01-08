// GET /api/community/rooms/:id/info
// Расширенная информация о комнате

import type { GetRoomInfoResponse, CommunityModerator } from '~/types/community'

export default defineEventHandler(async (event): Promise<GetRoomInfoResponse> => {
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

  // Получаем комнату
  const { data: room, error: roomError } = await supabase
    .from('community_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    throw createError({ statusCode: 404, message: 'Комната не найдена' })
  }

  // Получаем модераторов
  const { data: mods } = await supabase
    .from('community_members')
    .select(`
      role,
      user:users!community_members_user_id_fkey(
        id, first_name, last_name, nickname, avatar
      )
    `)
    .eq('room_id', roomId)
    .in('role', ['moderator', 'admin'])

  const moderators: CommunityModerator[] = (mods || []).map(m => {
    const user = m.user as any
    return {
      userId: user?.id,
      displayName: user?.nickname || user?.first_name || 'Пользователь',
      avatar: user?.avatar || null,
      role: m.role as 'moderator' | 'admin'
    }
  })

  // Получаем роль текущего пользователя
  const { data: membership } = await supabase
    .from('community_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', sessionUser.id)
    .single()

  const currentUserRole = membership?.role || 'member'

  // Проверяем мут
  const { data: muteData } = await supabase.rpc('check_community_mute', {
    p_room_id: roomId,
    p_user_id: sessionUser.id
  })

  const muteInfo = muteData?.[0] || { is_muted: false, expires_at: null }

  return {
    room: {
      id: room.id,
      level: room.level,
      parentId: room.parent_id,
      city: room.city,
      district: room.district,
      building: room.building,
      name: room.name,
      description: room.description,
      avatarUrl: room.avatar_url,
      membersCount: room.members_count,
      messagesCount: room.messages_count,
      isActive: room.is_active,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    },
    moderators,
    currentUserRole: currentUserRole as 'member' | 'moderator' | 'admin',
    isMuted: muteInfo.is_muted,
    mutedUntil: muteInfo.expires_at
  }
})
