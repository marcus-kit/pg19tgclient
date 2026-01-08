/**
 * Типы для системы чата
 */

// Типы отправителей
export type SenderType = 'user' | 'admin' | 'system'

// Статусы чата
export type ChatStatus = 'active' | 'waiting' | 'processing' | 'closed' | 'resolved'

// Типы контента сообщения
export type ContentType = 'text' | 'image' | 'file'

// Чат
export interface Chat {
  id: string
  user_id: string | null
  user_name: string | null
  guest_name: string | null
  guest_contact: string | null
  session_token: string | null
  status: ChatStatus
  assigned_to: string | null
  last_message_at: string | null
  unread_admin_count: number
  unread_user_count: number
  ai_summary: string | null
  source: string
  created_at: string
  updated_at: string
}

// Сообщение чата
export interface ChatMessage {
  id: string
  chat_id: string
  sender_type: SenderType
  sender_id: string | null
  sender_name: string | null
  content: string
  content_type: ContentType
  is_read: boolean
  read_at: string | null
  created_at: string
}

// Запрос на создание/получение сессии
export interface SessionRequest {
  chatId?: string
  userId?: string
  guestName?: string
  guestContact?: string
}

// Ответ API создания сессии
export interface SessionResponse {
  session: Chat
  isNew: boolean
}

// Запрос на отправку сообщения
export interface SendMessageRequest {
  chatId: string
  message: string
  senderType?: SenderType
  senderId?: string
  senderName?: string
}

// Ответ API отправки сообщения
export interface SendMessageResponse {
  message: ChatMessage
}

// Ответ API загрузки сообщений
export interface MessagesResponse {
  messages: ChatMessage[]
  total: number
}
