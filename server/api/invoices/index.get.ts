// GET /api/invoices
// Возвращает счета пользователя

import type { Invoice, InvoiceStatus } from '~/types/invoice'

interface InvoiceRow {
  id: number
  invoice_number: string
  account_id: number
  status: InvoiceStatus
  amount: number
  description: string | null
  period_start: string | null
  period_end: string | null
  issued_at: string | null
  due_date: string | null
  paid_at: string | null
  date_created: string
  date_updated: string
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
  const status = query.status as InvoiceStatus | undefined
  const limit = Number(query.limit) || 50

  // Запрос счетов
  let dbQuery = supabase
    .from('invoices')
    .select('*')
    .eq('account_id', sessionUser.accountId)
    .order('date_created', { ascending: false })
    .limit(limit)

  if (status) {
    dbQuery = dbQuery.eq('status', status)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error fetching invoices:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки счетов' })
  }

  // Маппинг в camelCase
  const invoices: Invoice[] = (data as InvoiceRow[]).map(row => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    accountId: row.account_id,
    status: row.status,
    amount: row.amount,
    description: row.description,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    issuedAt: row.issued_at,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    createdAt: row.date_created,
    updatedAt: row.date_updated
  }))

  return { invoices }
})
