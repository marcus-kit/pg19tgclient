// GET /api/community/rooms
// Возвращает все комнаты, доступные пользователю по его адресу

import type { CommunityRoom, CommunityMessagePreview } from '~/types/community'

interface RoomRow {
  id: string
  level: 'city' | 'district' | 'building'
  parent_id: string | null
  city: string
  district: string | null  // Район (переименовано с street)
  building: string | null
  name: string
  description: string | null
  avatar_url: string | null
  members_count: number
  messages_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Получаем пользователя из сессии
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем аккаунт с адресом
  const { data: account } = await supabase
    .from('accounts')
    .select('id, address_city, address_district, address_building')
    .eq('id', sessionUser.accountId)
    .single()

  if (!account?.address_city) {
    throw createError({ statusCode: 400, message: 'Адрес не указан в профиле' })
  }

  // Обеспечиваем существование комнат для адреса
  await supabase.rpc('ensure_community_rooms', {
    p_city: account.address_city,
    p_district: account.address_district || null,
    p_building: account.address_building || null
  })

  // Строим условия для получения комнат
  // 1. Город - всегда доступен
  // 2. Район - если совпадает
  // 3. Дом - если совпадает район и дом
  let query = supabase
    .from('community_rooms')
    .select('*')
    .eq('city', account.address_city)
    .eq('is_active', true)

  const { data: allRooms, error } = await query.order('level', { ascending: true })

  if (error) {
    console.error('Error fetching rooms:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки комнат' })
  }

  // Фильтруем комнаты по доступу
  const accessibleRooms = (allRooms as RoomRow[]).filter(room => {
    if (room.level === 'city') return true
    if (room.level === 'district') {
      return room.district === account.address_district
    }
    if (room.level === 'building') {
      return room.district === account.address_district && room.building === account.address_building
    }
    return false
  })

  const roomIds = accessibleRooms.map(r => r.id)

  // Получаем последние сообщения для каждой комнаты
  const { data: lastMessages } = await supabase
    .from('community_messages')
    .select(`
      id, room_id, content, content_type, created_at,
      user:users!community_messages_user_id_fkey(id, first_name, last_name)
    `)
    .in('room_id', roomIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // Группируем последние сообщения по room_id
  const lastMessageByRoom = new Map<string, CommunityMessagePreview>()
  for (const msg of lastMessages || []) {
    if (!lastMessageByRoom.has(msg.room_id)) {
      const user = msg.user as any
      lastMessageByRoom.set(msg.room_id, {
        id: msg.id,
        content: msg.content,
        contentType: msg.content_type,
        createdAt: msg.created_at,
        user: user ? {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name
        } : undefined
      })
    }
  }

  // Получаем членство
  const { data: memberships } = await supabase
    .from('community_members')
    .select('room_id, last_read_at')
    .eq('user_id', sessionUser.id)
    .in('room_id', roomIds)

  const membershipMap = new Map(memberships?.map(m => [m.room_id, m]) || [])

  // Получаем количество непрочитанных для всех комнат
  const { data: unreadData } = await supabase.rpc('get_community_unread_count', {
    p_user_id: sessionUser.id,
    p_room_ids: roomIds
  })

  const unreadMap = new Map<string, number>(
    (unreadData || []).map((r: { room_id: string; unread_count: number }) => [r.room_id, r.unread_count])
  )

  // Маппинг в camelCase
  const rooms: CommunityRoom[] = accessibleRooms.map(room => ({
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
    updatedAt: room.updated_at,
    lastMessage: lastMessageByRoom.get(room.id) || null,
    isMember: membershipMap.has(room.id),
    unreadCount: unreadMap.get(room.id) || 0
  }))

  return { rooms }
})
