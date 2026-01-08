// GET /api/invoices/unpaid
// Возвращает неоплаченные счета для dashboard

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

  // Получаем неоплаченные счета (issued или overdue)
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('account_id', sessionUser.accountId)
    .in('status', ['issued', 'overdue'])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching unpaid invoices:', error)
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
