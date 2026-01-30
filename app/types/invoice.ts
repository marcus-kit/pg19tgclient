export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: number
  invoiceNumber: string
  accountId: number
  status: InvoiceStatus
  amount: number // в копейках
  description: string | null
  periodStart: string | null
  periodEnd: string | null
  issuedAt: string | null
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

// Формат периода для отображения (например, "Январь 2024")
export function formatInvoicePeriod(invoice: Invoice): string {
  if (!invoice.periodStart) return ''
  const date = new Date(invoice.periodStart)
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

// Статусы для UI
export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Черновик',
  issued: 'Выставлен',
  paid: 'Оплачен',
  overdue: 'Просрочен',
  cancelled: 'Отменён',
}

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  draft: 'neutral',
  issued: 'primary',
  paid: 'success',
  overdue: 'error',
  cancelled: 'neutral',
}
