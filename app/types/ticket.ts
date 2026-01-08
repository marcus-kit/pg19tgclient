export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'technical' | 'billing' | 'connection' | 'tariff' | 'equipment' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Ticket {
  id: string
  number: string
  userId: string
  userName: string | null
  userEmail: string | null
  userPhone: string | null
  subject: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  firstResponseAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  // Joined data
  commentsCount?: number
}

export interface TicketComment {
  id: string
  ticketId: string
  authorType: 'user' | 'admin' | 'system'
  authorId: string
  authorName: string | null
  content: string
  isInternal: boolean
  isSolution: boolean
  attachments: TicketAttachment[]
  createdAt: string
  editedAt: string | null
}

export interface TicketAttachment {
  name: string
  url: string
  size: number
  mimeType: string
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[]
}

// Статусы для UI
export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: 'Новый',
  open: 'В работе',
  pending: 'Ожидает ответа',
  resolved: 'Решён',
  closed: 'Закрыт'
}

export const ticketStatusColors: Record<TicketStatus, string> = {
  new: 'primary',
  open: 'blue',
  pending: 'yellow',
  resolved: 'green',
  closed: 'gray'
}

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  technical: 'Технические проблемы',
  billing: 'Вопросы оплаты',
  connection: 'Подключение',
  tariff: 'Смена тарифа',
  equipment: 'Оборудование',
  other: 'Другое'
}

export const ticketCategoryIcons: Record<TicketCategory, string> = {
  technical: 'heroicons:wrench-screwdriver',
  billing: 'heroicons:credit-card',
  connection: 'heroicons:wifi',
  tariff: 'heroicons:arrow-path',
  equipment: 'heroicons:tv',
  other: 'heroicons:question-mark-circle'
}

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  urgent: 'Срочный'
}
