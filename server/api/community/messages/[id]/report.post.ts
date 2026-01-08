// POST /api/community/messages/:id/report
// Пожаловаться на сообщение

import type { ReportMessageRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const messageId = Number(getRouterParam(event, 'id'))
  if (!messageId) {
    throw createError({ statusCode: 400, message: 'ID сообщения обязателен' })
  }

  const body = await readBody<ReportMessageRequest>(event)

  if (!body.reason) {
    throw createError({ statusCode: 400, message: 'Причина обязательна' })
  }

  const validReasons = ['spam', 'abuse', 'fraud', 'other']
  if (!validReasons.includes(body.reason)) {
    throw createError({ statusCode: 400, message: 'Недопустимая причина' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Проверяем что сообщение существует
  const { data: message, error: msgError } = await supabase
    .from('community_messages')
    .select('id, user_id, is_deleted')
    .eq('id', messageId)
    .single()

  if (msgError || !message) {
    throw createError({ statusCode: 404, message: 'Сообщение не найдено' })
  }

  if (message.is_deleted) {
    throw createError({ statusCode: 400, message: 'Сообщение уже удалено' })
  }

  // Нельзя жаловаться на себя
  if (message.user_id === sessionUser.id) {
    throw createError({ statusCode: 400, message: 'Нельзя пожаловаться на своё сообщение' })
  }

  // Создаём жалобу
  const { error } = await supabase
    .from('community_reports')
    .insert({
      message_id: messageId,
      reported_by: sessionUser.id,
      reason: body.reason,
      details: body.details || null
    })

  if (error) {
    // Уже есть жалоба от этого пользователя
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Вы уже жаловались на это сообщение' })
    }

    console.error('Error creating report:', error)
    throw createError({ statusCode: 500, message: 'Ошибка создания жалобы' })
  }

  return { success: true }
})
