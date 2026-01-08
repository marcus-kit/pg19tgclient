// POST /api/support/tickets
// Создаёт новый тикет

import type { Ticket, TicketCategory } from '~/types/ticket'

interface CreateTicketBody {
  subject: string
  description: string
  category: TicketCategory
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Получаем пользователя из сессии
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем данные из body
  const body = await readBody<CreateTicketBody>(event)

  if (!body.subject?.trim()) {
    throw createError({ statusCode: 400, message: 'Тема обращения обязательна' })
  }

  if (!body.description?.trim()) {
    throw createError({ statusCode: 400, message: 'Описание проблемы обязательно' })
  }

  // Получаем данные пользователя для денормализации
  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name, email, phone, telegram_id')
    .eq('id', sessionUser.id)
    .single()

  // Создаём тикет (номер генерируется триггером)
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: sessionUser.id,
      user_name: user ? `${user.first_name} ${user.last_name || ''}`.trim() : null,
      user_email: user?.email || null,
      user_phone: user?.phone || null,
      user_telegram_id: user?.telegram_id ? Number(user.telegram_id) : null,
      subject: body.subject.trim(),
      description: body.description.trim(),
      category: body.category || 'other',
      status: 'new',
      priority: 'normal'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ticket:', error)
    throw createError({ statusCode: 500, message: 'Ошибка создания тикета' })
  }

  const ticket: Ticket = {
    id: String(data.id),
    number: data.number,
    userId: String(data.user_id),
    userName: data.user_name,
    userEmail: data.user_email,
    userPhone: data.user_phone,
    subject: data.subject,
    description: data.description,
    category: data.category,
    status: data.status,
    priority: data.priority,
    firstResponseAt: data.first_response_at,
    resolvedAt: data.resolved_at,
    closedAt: data.closed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    commentsCount: 0
  }

  return { ticket }
})
