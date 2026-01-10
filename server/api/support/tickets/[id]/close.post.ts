// POST /api/support/tickets/:id/close
// Закрытие тикета пользователем (resolved или closed)

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) {
    throw createError({ statusCode: 400, message: 'ID тикета обязателен' })
  }

  // Получаем пользователя из сессии
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Читаем body
  const body = await readBody(event)
  const status = body?.status

  // Валидация статуса
  if (!status || !['resolved', 'closed'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Некорректный статус. Допустимые: resolved, closed' })
  }

  // Получаем тикет и проверяем владельца
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    throw createError({ statusCode: 404, message: 'Тикет не найден' })
  }

  if (ticket.user_id !== sessionUser.id) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этому тикету' })
  }

  // Проверяем что тикет ещё не закрыт
  if (['resolved', 'closed'].includes(ticket.status)) {
    throw createError({ statusCode: 400, message: 'Тикет уже закрыт' })
  }

  // Обновляем тикет
  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    status,
    updated_at: now
  }

  if (status === 'resolved') {
    updateData.resolved_at = now
  } else {
    updateData.closed_at = now
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)

  if (updateError) {
    console.error('Error updating ticket:', updateError)
    throw createError({ statusCode: 500, message: 'Ошибка обновления тикета' })
  }

  // Добавляем системный комментарий
  const systemComment = status === 'resolved'
    ? 'Пользователь отметил заявку как решённую'
    : 'Пользователь закрыл заявку'

  const { error: commentError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_type: 'system',
      author_id: sessionUser.id,
      author_name: null,
      content: systemComment,
      is_internal: false,
      is_solution: false
    })

  if (commentError) {
    console.error('Error adding system comment:', commentError)
    // Не кидаем ошибку — тикет уже закрыт, комментарий не критичен
  }

  return { success: true, status }
})
