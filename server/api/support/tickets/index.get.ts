// GET /api/support/tickets
// Возвращает тикеты пользователя

import type { Ticket, TicketStatus, TicketCategory, TicketPriority } from '~/types/ticket'

interface TicketRow {
  id: string | number
  number: string
  user_id: string | number
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  subject: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  comments_count?: number
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Получаем пользователя из сессии
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Query параметры
  const query = getQuery(event)
  const status = query.status as TicketStatus | undefined

  // Запрос тикетов
  let dbQuery = supabase
    .from('tickets')
    .select('*')
    .eq('user_id', sessionUser.id)
    .order('created_at', { ascending: false })

  if (status) {
    dbQuery = dbQuery.eq('status', status)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error fetching tickets:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки тикетов' })
  }

  // Получаем количество комментариев для каждого тикета
  const ticketIds = (data || []).map(t => t.id)

  let commentsCounts: Record<string, number> = {}
  if (ticketIds.length > 0) {
    const { data: commentsData } = await supabase
      .from('ticket_comments')
      .select('ticket_id')
      .in('ticket_id', ticketIds)
      .eq('is_internal', false)

    for (const c of commentsData || []) {
      const ticketId = String(c.ticket_id)
      commentsCounts[ticketId] = (commentsCounts[ticketId] || 0) + 1
    }
  }

  // Маппинг в camelCase
  const tickets: Ticket[] = (data as TicketRow[]).map(row => ({
    id: String(row.id),
    number: row.number,
    userId: String(row.user_id),
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone,
    subject: row.subject,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    firstResponseAt: row.first_response_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    commentsCount: commentsCounts[String(row.id)] || 0
  }))

  return { tickets }
})
