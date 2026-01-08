// GET /api/community/rooms/[id]/online
// Получить список онлайн пользователей в комнате

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'id')
  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId обязателен' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем комнату
  const { data: room } = await supabase
    .from('community_rooms')
    .select('id, city, district, building')
    .eq('id', roomId)
    .single()

  if (!room) {
    throw createError({ statusCode: 404, message: 'Комната не найдена' })
  }

  // Получаем онлайн пользователей которые являются членами комнаты
  // и были активны в последние 5 минут
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: onlineMembers, error } = await supabase
    .from('community_members')
    .select(`
      user_id,
      user:users!community_members_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar,
        nickname,
        online_status,
        last_seen_at
      )
    `)
    .eq('room_id', roomId)
    .not('user', 'is', null)

  if (error) {
    console.error('Error fetching online users:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки' })
  }

  // Фильтруем только онлайн пользователей (активных в последние 5 минут)
  const onlineUsers = (onlineMembers || [])
    .filter(m => {
      const user = m.user as any
      return user &&
        user.online_status === 'online' &&
        user.last_seen_at &&
        new Date(user.last_seen_at) > new Date(fiveMinutesAgo)
    })
    .map(m => {
      const user = m.user as any
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        nickname: user.nickname,
        lastSeenAt: user.last_seen_at
      }
    })

  return {
    roomId,
    onlineCount: onlineUsers.length,
    users: onlineUsers
  }
})
