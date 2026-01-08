// GET /api/support/tickets/:id
// Возвращает тикет с комментариями

import type { TicketDetail, TicketComment } from '~/types/ticket'

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

  // Получаем тикет
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', sessionUser.id)
    .single()

  if (ticketError || !ticket) {
    throw createError({ statusCode: 404, message: 'Тикет не найден' })
  }

  // Получаем комментарии (только не внутренние)
  const { data: comments, error: commentsError } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  if (commentsError) {
    console.error('Error fetching comments:', commentsError)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки комментариев' })
  }

  // Маппинг комментариев
  const mappedComments: TicketComment[] = (comments || []).map(c => ({
    id: String(c.id),
    ticketId: String(c.ticket_id),
    authorType: c.author_type,
    authorId: c.author_id,
    authorName: c.author_name,
    content: c.content,
    isInternal: c.is_internal,
    isSolution: c.is_solution,
    attachments: c.attachments || [],
    createdAt: c.created_at,
    editedAt: c.edited_at
  }))

  // Маппинг тикета
  const result: TicketDetail = {
    id: String(ticket.id),
    number: ticket.number,
    userId: String(ticket.user_id),
    userName: ticket.user_name,
    userEmail: ticket.user_email,
    userPhone: ticket.user_phone,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    firstResponseAt: ticket.first_response_at,
    resolvedAt: ticket.resolved_at,
    closedAt: ticket.closed_at,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    comments: mappedComments
  }

  return { ticket: result }
})
