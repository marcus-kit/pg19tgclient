// GET /api/community/messages
// Загрузка сообщений комнаты с пагинацией

import type { CommunityMessage } from '~/types/community'

interface MessageRow {
  id: string
  room_id: string
  user_id: string
  content: string
  content_type: 'text' | 'image' | 'system'
  image_url: string | null
  image_width: number | null
  image_height: number | null
  is_pinned: boolean
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  reply_to_id: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    avatar?: string | null
  } | null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const roomId = query.roomId as string
  const limit = Math.min(Number(query.limit) || 50, 100)
  const before = query.before as string | undefined
  const after = query.after as string | undefined // Для reconnect: загрузить сообщения ПОСЛЕ указанного ID
  const pinned = query.pinned === 'true'
  const ids = query.ids ? String(query.ids).split(',') : undefined

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId обязателен' })
  }

  const supabase = useSupabaseServer()

  // Проверяем авторизацию
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Проверяем доступ к комнате
  const { data: room } = await supabase
    .from('community_rooms')
    .select('id, city, district, building')
    .eq('id', roomId)
    .single()

  if (!room) {
    throw createError({ statusCode: 404, message: 'Комната не найдена' })
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('address_city, address_district, address_building')
    .eq('id', sessionUser.accountId)
    .single()

  // Проверка доступа по географии
  if (account?.address_city !== room.city) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этой комнате' })
  }
  if (room.district && account?.address_district !== room.district) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этой комнате' })
  }
  if (room.building && account?.address_building !== room.building) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этой комнате' })
  }

  // Строим запрос
  let messagesQuery = supabase
    .from('community_messages')
    .select(`
      *,
      user:users!community_messages_user_id_fkey(id, first_name, last_name, avatar)
    `)
    .eq('room_id', roomId)

  // Фильтры
  if (ids && ids.length > 0) {
    messagesQuery = messagesQuery.in('id', ids)
  } else if (pinned) {
    messagesQuery = messagesQuery.eq('is_pinned', true)
  } else if (after) {
    // Загрузить сообщения ПОСЛЕ указанного ID (для reconnect)
    messagesQuery = messagesQuery
      .gt('id', after)
      .order('created_at', { ascending: true })
      .limit(limit + 1)
  } else {
    if (before) {
      messagesQuery = messagesQuery.lt('id', before)
    }
    messagesQuery = messagesQuery
      .order('created_at', { ascending: false })
      .limit(limit + 1) // +1 для проверки hasMore
  }

  const { data: rows, error } = await messagesQuery

  if (error) {
    console.error('Error fetching messages:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки сообщений' })
  }

  const messageRows = rows as MessageRow[]

  // Проверяем hasMore (не применяется для pinned, ids и after)
  const hasMore = !pinned && !ids && !after && messageRows.length > limit
  const messagesToReturn = hasMore ? messageRows.slice(0, limit) : messageRows

  // Получаем reply_to сообщения если есть
  const replyToIds = messagesToReturn
    .filter(m => m.reply_to_id)
    .map(m => m.reply_to_id as string)

  let replyToMap = new Map<string, CommunityMessage>()
  if (replyToIds.length > 0) {
    const { data: replyMessages } = await supabase
      .from('community_messages')
      .select(`
        *,
        user:users!community_messages_user_id_fkey(id, first_name, last_name)
      `)
      .in('id', replyToIds)

    for (const reply of replyMessages || []) {
      const user = reply.user as any
      replyToMap.set(reply.id, {
        id: reply.id,
        roomId: reply.room_id,
        userId: reply.user_id,
        content: reply.is_deleted ? 'Сообщение удалено' : reply.content,
        contentType: reply.content_type,
        imageUrl: reply.image_url,
        imageWidth: reply.image_width,
        imageHeight: reply.image_height,
        isPinned: reply.is_pinned,
        isDeleted: reply.is_deleted,
        deletedAt: reply.deleted_at,
        deletedBy: reply.deleted_by,
        replyToId: reply.reply_to_id,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
        user: user ? {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name
        } : undefined
      })
    }
  }

  // Маппинг в camelCase
  const messages: CommunityMessage[] = messagesToReturn
    .map(msg => {
      const user = msg.user as any
      return {
        id: msg.id,
        roomId: msg.room_id,
        userId: msg.user_id,
        content: msg.is_deleted ? 'Сообщение удалено' : msg.content,
        contentType: msg.content_type,
        imageUrl: msg.image_url,
        imageWidth: msg.image_width,
        imageHeight: msg.image_height,
        isPinned: msg.is_pinned,
        isDeleted: msg.is_deleted,
        deletedAt: msg.deleted_at,
        deletedBy: msg.deleted_by,
        replyToId: msg.reply_to_id,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        user: user ? {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar
        } : undefined,
        replyTo: msg.reply_to_id ? replyToMap.get(msg.reply_to_id) || null : null
      }
    })
    // Сортируем по возрастанию для отображения
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return { messages, hasMore }
})
