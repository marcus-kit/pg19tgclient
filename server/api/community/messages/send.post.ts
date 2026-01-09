// POST /api/community/messages/send
// Отправка сообщения в комнату (оптимизировано через RPC)

import type { SendMessageRequest, CommunityMessage } from '~/types/community'
import { communityMessageLimiter, communityImageLimiter } from '~~/server/utils/rateLimit'
import { sendCommunityNotifications, type NotificationPayload } from '~~/server/utils/communityNotifier'

interface RpcResponse {
  success?: boolean
  error?: string
  message?: string
  muted_until?: string
}

interface RpcMessageData {
  id: string
  room_id: string
  user_id: string
  content: string
  content_type: string
  image_url: string | null
  image_width: number | null
  image_height: number | null
  is_pinned: boolean
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  reply_to_id: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    avatar: string | null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SendMessageRequest>(event)

  // Валидация
  if (!body.roomId) {
    throw createError({ statusCode: 400, message: 'roomId обязателен' })
  }
  if (!body.content?.trim() && body.contentType !== 'image') {
    throw createError({ statusCode: 400, message: 'Сообщение не может быть пустым' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Rate limiting (остаётся в API layer для быстрого отказа)
  const rateLimitKey = `user:${sessionUser.id}`

  if (body.contentType === 'image') {
    if (!communityImageLimiter.check(rateLimitKey)) {
      const resetIn = Math.ceil(communityImageLimiter.resetIn(rateLimitKey) / 1000)
      throw createError({
        statusCode: 429,
        message: `Слишком много изображений. Подождите ${resetIn} сек.`
      })
    }
  }

  if (!communityMessageLimiter.check(rateLimitKey)) {
    const resetIn = Math.ceil(communityMessageLimiter.resetIn(rateLimitKey) / 1000)
    throw createError({
      statusCode: 429,
      message: `Слишком много сообщений. Подождите ${resetIn} сек.`
    })
  }

  // Вызов RPC функции (объединяет 6-7 запросов в один)
  const { data, error } = await supabase.rpc('send_community_message', {
    p_user_id: sessionUser.id,
    p_account_id: sessionUser.accountId,
    p_room_id: body.roomId,
    p_content: body.content?.trim() || '',
    p_content_type: body.contentType || 'text',
    p_image_url: body.imageUrl || null,
    p_image_width: body.imageWidth || null,
    p_image_height: body.imageHeight || null,
    p_reply_to_id: body.replyToId || null
  })

  if (error) {
    console.error('RPC send_community_message error:', error)
    throw createError({ statusCode: 500, message: 'Ошибка отправки сообщения' })
  }

  const response = data as RpcResponse & { message?: RpcMessageData }

  // Обработка ошибок из RPC
  if (response.error) {
    const errorMap: Record<string, { status: number; message: string }> = {
      room_not_found: { status: 404, message: response.message || 'Комната не найдена' },
      room_inactive: { status: 400, message: response.message || 'Комната неактивна' },
      account_not_found: { status: 400, message: response.message || 'Аккаунт не найден' },
      access_denied: { status: 403, message: response.message || 'Нет доступа к этой комнате' },
      banned: { status: 403, message: response.message || 'Вы заблокированы в этом чате' },
      muted: { status: 403, message: formatMuteMessage(response.muted_until) }
    }

    const err = errorMap[response.error] || { status: 400, message: response.message || 'Ошибка' }
    throw createError({ statusCode: err.status, message: err.message })
  }

  if (!response.success || !response.message) {
    throw createError({ statusCode: 500, message: 'Неожиданный ответ от сервера' })
  }

  // Маппинг в camelCase для клиента
  const msg = response.message
  const result: CommunityMessage = {
    id: msg.id,
    roomId: msg.room_id,
    userId: msg.user_id,
    content: msg.content,
    contentType: msg.content_type as 'text' | 'image' | 'system',
    imageUrl: msg.image_url,
    imageWidth: msg.image_width,
    imageHeight: msg.image_height,
    isPinned: msg.is_pinned,
    isDeleted: msg.is_deleted,
    deletedAt: msg.deleted_at,
    deletedBy: msg.deleted_by,
    replyToId: msg.reply_to_id,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
    user: msg.user ? {
      id: msg.user.id,
      firstName: msg.user.first_name,
      lastName: msg.user.last_name,
      avatar: msg.user.avatar
    } : undefined
  }

  // Broadcast для мгновенной доставки (остаётся в API layer)
  try {
    const channel = supabase.channel(`community:${body.roomId}`)
    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: result
    })
    await supabase.removeChannel(channel)
  } catch (e) {
    // Не критично — postgres_changes доставит
    console.warn('Failed to broadcast message:', e)
  }

  // Уведомления офлайн-пользователям через Telegram (fire-and-forget)
  // Не блокируем ответ клиенту
  notifyOfflineUsers(supabase, body.roomId, sessionUser.id, result).catch(e => {
    console.warn('[Notifications] Failed to notify offline users:', e)
  })

  return { message: result }
})

/**
 * Отправка уведомлений офлайн-пользователям
 */
async function notifyOfflineUsers(
  supabase: ReturnType<typeof useSupabaseServer>,
  roomId: string,
  senderId: string,
  message: CommunityMessage
): Promise<void> {
  // Получаем офлайн-пользователей
  const { data: offlineUsers, error } = await supabase.rpc('get_offline_room_members', {
    p_room_id: roomId,
    p_sender_id: senderId
  })

  if (error || !offlineUsers?.length) {
    return
  }

  // Получаем имя комнаты
  const { data: room } = await supabase
    .from('community_rooms')
    .select('name')
    .eq('id', roomId)
    .single()

  const roomName = room?.name || 'Чат'
  const senderName = message.user
    ? `${message.user.firstName} ${message.user.lastName || ''}`.trim()
    : 'Пользователь'

  // Превью сообщения (до 100 символов)
  let preview = message.content
  if (message.contentType === 'image') {
    preview = '📷 Изображение'
  } else if (preview.length > 100) {
    preview = preview.slice(0, 100) + '...'
  }

  // Формируем payloads
  const payloads: NotificationPayload[] = offlineUsers.map((user: any) => ({
    telegramChatId: user.telegram_id,
    roomId,
    roomName,
    senderName,
    messagePreview: preview
  }))

  // Отправляем (не ждём результата)
  const result = await sendCommunityNotifications(payloads)
  if (result.sent > 0 || result.failed > 0) {
    console.log(`[Notifications] Sent ${result.sent}, failed ${result.failed} for room ${roomId}`)
  }
}

// Форматирование времени мута
function formatMuteMessage(mutedUntil?: string): string {
  if (!mutedUntil) return 'Вы не можете писать'

  const date = new Date(mutedUntil)
  const formatted = date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
  return `Вы не можете писать до ${formatted}`
}
