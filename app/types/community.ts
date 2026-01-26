// Community Chat Types

// Уровни комнат (district заменил street в v2)
export type CommunityRoomLevel = 'city' | 'district' | 'building'

// Типы контента
export type CommunityContentType = 'text' | 'image' | 'system'

// Роли в комнате
export type CommunityMemberRole = 'member' | 'moderator' | 'admin'

// Статус отправки сообщения (только для optimistic UI)
export type MessageStatus = 'sending' | 'sent' | 'failed'

// Пользователь в сообщении (минимальные данные)
export interface CommunityUser {
  id: string
  firstName: string
  lastName: string
  nickname?: string | null
  avatar?: string | null
}

// Статус жалобы
export type CommunityReportStatus = 'pending' | 'reviewed' | 'dismissed'

// Причины жалоб
export type CommunityReportReason = 'spam' | 'abuse' | 'fraud' | 'other'

// Комната чата
export interface CommunityRoom {
  id: string
  level: CommunityRoomLevel
  parentId: string | null
  city: string
  district: string | null
  building: string | null
  name: string
  description: string | null
  avatarUrl: string | null
  membersCount: number
  messagesCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Вычисляемые поля
  isMember?: boolean
  unreadCount?: number
  lastMessage?: CommunityMessagePreview | null
}

// Превью последнего сообщения
export interface CommunityMessagePreview {
  id: string
  content: string
  contentType: CommunityContentType
  createdAt: string
  user?: CommunityUser
}

// Участник комнаты
export interface CommunityMember {
  id: string
  roomId: string
  userId: string
  accountId: string
  role: CommunityMemberRole
  notificationsEnabled: boolean
  lastReadAt: string | null
  joinedAt: string
  // Joined fields
  user?: CommunityUser
}

// Preview для reply (только нужные поля для отображения цитаты)
export interface CommunityReplyPreview {
  id: string | number
  content: string
  user?: CommunityUser
}

// Сообщение
export interface CommunityMessage {
  id: string | number
  roomId: string | number
  userId: string
  content: string
  contentType: CommunityContentType
  imageUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  isPinned: boolean
  isDeleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  replyToId: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  user?: CommunityUser
  replyTo?: CommunityReplyPreview | null
  // Optimistic UI status (клиентское поле, не хранится в БД)
  status?: MessageStatus
}

// Бан
export interface CommunityBan {
  id: string
  roomId: string
  userId: string
  bannedBy: string
  reason: string | null
  expiresAt: string | null
  createdAt: string
}

// Мут (временный запрет писать)
export interface CommunityMute {
  id: string
  roomId: string
  userId: string
  mutedBy: string
  reason: string | null
  expiresAt: string
  createdAt: string
}

// Жалоба на сообщение
export interface CommunityReport {
  id: string
  messageId: string
  reportedBy: string
  reason: CommunityReportReason
  details: string | null
  status: CommunityReportStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  // Joined fields
  message?: CommunityMessage
  reporter?: CommunityUser
}

// Информация о комнате (расширенная)
export interface CommunityRoomInfo {
  room: CommunityRoom
  moderators: CommunityModerator[]
  currentUserRole: CommunityMemberRole
  isMuted?: boolean
  mutedUntil?: string | null
}

// Модератор комнаты
export interface CommunityModerator {
  userId: string
  displayName: string
  avatar?: string | null
  role: 'moderator' | 'admin'
}

// =====================================================
// API запросы/ответы
// =====================================================

// GET /api/community/rooms
export interface GetRoomsResponse {
  rooms: CommunityRoom[]
}

// GET /api/community/messages
export interface GetMessagesRequest {
  roomId: string
  limit?: number
  before?: string
  pinned?: boolean
  ids?: string
}

export interface GetMessagesResponse {
  messages: CommunityMessage[]
  hasMore: boolean
}

// POST /api/community/messages/send
export interface SendMessageRequest {
  roomId: string
  content: string
  contentType?: CommunityContentType
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  replyToId?: string
}

export interface SendMessageResponse {
  message: CommunityMessage
}

// POST /api/community/upload/image
export interface UploadImageResponse {
  url: string
  width: number
  height: number
}

// POST /api/community/moderation/mute
export interface MuteUserRequest {
  roomId: string
  userId: string
  duration: number
  reason?: string
}

// POST /api/community/moderation/unmute
export interface UnmuteUserRequest {
  roomId: string
  userId: string
}

// POST /api/community/messages/:id/report
export interface ReportMessageRequest {
  reason: CommunityReportReason
  details?: string
}

// GET /api/community/rooms/:id/info
export interface GetRoomInfoResponse {
  room: CommunityRoom
  moderators: CommunityModerator[]
  currentUserRole: CommunityMemberRole
  isMuted: boolean
  mutedUntil: string | null
}

// POST /api/community/rooms/mark-read
export interface MarkReadRequest {
  roomId: string
}
