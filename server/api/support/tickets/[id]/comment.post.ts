// POST /api/support/tickets/:id/comment
// Добавляет комментарий к тикету

import type { TicketComment } from '~/types/ticket'

interface AddCommentBody {
  content: string
}

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

  // Получаем данные из body
  const body = await readBody<AddCommentBody>(event)

  if (!body.content?.trim()) {
    throw createError({ statusCode: 400, message: 'Комментарий не может быть пустым' })
  }

  // Проверяем, что тикет принадлежит пользователю
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('user_id', sessionUser.id)
    .single()

  if (ticketError || !ticket) {
    throw createError({ statusCode: 404, message: 'Тикет не найден' })
  }

  // Проверяем, что тикет не закрыт
  if (ticket.status === 'closed') {
    throw createError({ statusCode: 400, message: 'Нельзя добавить комментарий к закрытому тикету' })
  }

  // Получаем имя пользователя
  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', sessionUser.id)
    .single()

  const authorName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Пользователь'

  // Создаём комментарий
  const { data: comment, error: commentError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_type: 'user',
      author_id: String(sessionUser.id),
      author_name: authorName,
      content: body.content.trim(),
      is_internal: false,
      is_solution: false
    })
    .select()
    .single()

  if (commentError) {
    console.error('Error creating comment:', commentError)
    throw createError({ statusCode: 500, message: 'Ошибка добавления комментария' })
  }

  // Если тикет был в статусе pending, возвращаем в open
  if (ticket.status === 'pending') {
    await supabase
      .from('tickets')
      .update({ status: 'open' })
      .eq('id', ticketId)
  }

  const result: TicketComment = {
    id: String(comment.id),
    ticketId: String(comment.ticket_id),
    authorType: comment.author_type,
    authorId: comment.author_id,
    authorName: comment.author_name,
    content: comment.content,
    isInternal: comment.is_internal,
    isSolution: comment.is_solution,
    attachments: comment.attachments || [],
    createdAt: comment.created_at,
    editedAt: comment.edited_at
  }

  return { comment: result }
})
