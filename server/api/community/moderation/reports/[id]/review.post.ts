// POST /api/community/moderation/reports/:id/review
// Рассмотреть жалобу (модератор/админ)

import type { ReviewReportRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const reportId = Number(getRouterParam(event, 'id'))
  if (!reportId) {
    throw createError({ statusCode: 400, message: 'ID жалобы обязателен' })
  }

  const body = await readBody<ReviewReportRequest>(event)

  const validActions = ['dismiss', 'delete_message', 'mute_user', 'ban_user']
  if (!body.action || !validActions.includes(body.action)) {
    throw createError({ statusCode: 400, message: 'Недопустимое действие' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем жалобу с информацией о сообщении
  const { data: report, error: reportError } = await supabase
    .from('community_reports')
    .select(`
      id, status, message_id,
      message:community_messages!community_reports_message_id_fkey(
        id, room_id, user_id, is_deleted
      )
    `)
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    throw createError({ statusCode: 404, message: 'Жалоба не найдена' })
  }

  if (report.status !== 'pending') {
    throw createError({ statusCode: 400, message: 'Жалоба уже рассмотрена' })
  }

  const message = report.message as any
  if (!message) {
    throw createError({ statusCode: 404, message: 'Сообщение не найдено' })
  }

  // Проверяем права модератора
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', sessionUser.id)
    .single()

  const isGlobalAdmin = user?.role === 'admin'

  if (!isGlobalAdmin) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('room_id', message.room_id)
      .eq('user_id', sessionUser.id)
      .single()

    const isModerator = membership?.role === 'moderator' || membership?.role === 'admin'
    if (!isModerator) {
      throw createError({ statusCode: 403, message: 'Нет прав для рассмотрения жалобы' })
    }
  }

  // Выполняем действие
  if (body.action === 'delete_message' && !message.is_deleted) {
    // Удаляем сообщение
    await supabase
      .from('community_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: sessionUser.id
      })
      .eq('id', message.id)
  }

  if (body.action === 'mute_user') {
    const duration = body.muteDuration || 60 // по умолчанию 1 час
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString()

    await supabase
      .from('community_mutes')
      .upsert({
        room_id: message.room_id,
        user_id: message.user_id,
        muted_by: sessionUser.id,
        reason: 'Жалоба на сообщение',
        expires_at: expiresAt
      }, { onConflict: 'room_id,user_id' })
  }

  if (body.action === 'ban_user') {
    await supabase
      .from('community_bans')
      .upsert({
        room_id: message.room_id,
        user_id: message.user_id,
        banned_by: sessionUser.id,
        reason: body.banReason || 'Нарушение правил сообщества'
      }, { onConflict: 'room_id,user_id' })
  }

  // Обновляем статус жалобы
  const newStatus = body.action === 'dismiss' ? 'dismissed' : 'reviewed'

  const { error: updateError } = await supabase
    .from('community_reports')
    .update({
      status: newStatus,
      reviewed_by: sessionUser.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (updateError) {
    console.error('Error updating report:', updateError)
    throw createError({ statusCode: 500, message: 'Ошибка обновления жалобы' })
  }

  return { success: true, status: newStatus }
})
