// GET /api/community/moderation/reports
// Список жалоб на сообщения (для модераторов)

import type { GetReportsResponse } from '~/types/community'

export default defineEventHandler(async (event): Promise<GetReportsResponse> => {
  const query = getQuery(event)
  const roomId = query.roomId ? Number(query.roomId) : undefined
  const status = query.status as string | undefined
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Проверяем права модератора (глобальный admin или модератор комнаты)
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', sessionUser.id)
    .single()

  const isGlobalAdmin = user?.role === 'admin'

  // Если не глобальный админ — проверяем права модератора в комнате
  if (!isGlobalAdmin && roomId) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', sessionUser.id)
      .single()

    const isModerator = membership?.role === 'moderator' || membership?.role === 'admin'
    if (!isModerator) {
      throw createError({ statusCode: 403, message: 'Нет прав для просмотра жалоб' })
    }
  } else if (!isGlobalAdmin && !roomId) {
    throw createError({ statusCode: 403, message: 'Укажите roomId или войдите как администратор' })
  }

  // Строим запрос
  let reportsQuery = supabase
    .from('community_reports')
    .select(`
      id,
      message_id,
      reported_by,
      reason,
      details,
      status,
      reviewed_by,
      reviewed_at,
      created_at,
      message:community_messages!community_reports_message_id_fkey(
        id, room_id, user_id, content, content_type, created_at,
        user:users!community_messages_user_id_fkey(id, first_name, last_name, nickname, avatar)
      ),
      reporter:users!community_reports_reported_by_fkey(id, first_name, last_name, nickname, avatar)
    `, { count: 'exact' })

  // Фильтр по комнате (если указан)
  if (roomId) {
    reportsQuery = reportsQuery.eq('message.room_id', roomId)
  }

  // Фильтр по статусу
  if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) {
    reportsQuery = reportsQuery.eq('status', status)
  }

  // Пагинация и сортировка
  reportsQuery = reportsQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: reports, error, count } = await reportsQuery

  if (error) {
    console.error('Error fetching reports:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки жалоб' })
  }

  // Преобразуем данные
  const formattedReports = (reports || []).map(r => {
    const msg = r.message as any
    const reporter = r.reporter as any
    return {
      id: r.id,
      messageId: r.message_id,
      reportedBy: r.reported_by,
      reason: r.reason as 'spam' | 'abuse' | 'fraud' | 'other',
      details: r.details,
      status: r.status as 'pending' | 'reviewed' | 'dismissed',
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      createdAt: r.created_at,
      message: msg ? {
        id: msg.id,
        roomId: msg.room_id,
        userId: msg.user_id,
        content: msg.content,
        contentType: msg.content_type,
        createdAt: msg.created_at,
        user: msg.user ? {
          id: msg.user.id,
          firstName: msg.user.first_name,
          lastName: msg.user.last_name,
          nickname: msg.user.nickname,
          avatar: msg.user.avatar
        } : undefined
      } : undefined,
      reporter: reporter ? {
        id: reporter.id,
        firstName: reporter.first_name,
        lastName: reporter.last_name,
        nickname: reporter.nickname,
        avatar: reporter.avatar
      } : undefined
    }
  })

  return {
    reports: formattedReports,
    total: count || 0
  }
})
