// POST /api/internal/process-notifications
// Обработка очереди отложенных уведомлений
// Вызывается каждые 30 секунд через systemd timer или внешний cron

import { sendBatchNotification, type BatchNotificationPayload } from '~~/server/utils/communityNotifier'

interface QueuedNotification {
  user_id: string
  telegram_chat_id: string
  room_id: string
  room_name: string
  message_count: number
  message_previews: Array<{
    sender_name: string
    preview: string
    content_type: string
  }>
}

export default defineEventHandler(async (event) => {
  // Проверка секретного ключа для защиты endpoint
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  // Если настроен internalApiSecret - проверяем его
  // Если не настроен - разрешаем только с localhost
  const internalSecret = config.internalApiSecret
  if (internalSecret) {
    if (authHeader !== `Bearer ${internalSecret}`) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  } else {
    // Fallback: разрешаем только с localhost
    const host = getHeader(event, 'host') || ''
    const forwarded = getHeader(event, 'x-forwarded-for')
    if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1') && forwarded) {
      console.warn('[ProcessNotifications] Blocked request from non-localhost without secret')
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const supabase = useSupabaseServer()

  // Получаем и удаляем записи готовые к отправке (атомарно)
  const { data: notifications, error } = await supabase.rpc('process_notification_queue')

  if (error) {
    console.error('[ProcessNotifications] RPC error:', error)
    throw createError({ statusCode: 500, message: 'Failed to process queue' })
  }

  const queue = (notifications || []) as QueuedNotification[]

  if (!queue.length) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  console.log(`[ProcessNotifications] Processing ${queue.length} notifications`)

  let sent = 0
  let failed = 0

  // Отправляем уведомления
  for (const n of queue) {
    const payload: BatchNotificationPayload = {
      telegramChatId: n.telegram_chat_id,
      roomId: n.room_id,
      roomName: n.room_name,
      messageCount: n.message_count,
      messagePreviews: n.message_previews
    }

    const result = await sendBatchNotification(payload)

    if (result.success) {
      sent++
    } else {
      failed++
      console.warn(`[ProcessNotifications] Failed for ${n.telegram_chat_id}:`, result.error)
    }

    // Rate limit: 30 msg/sec max для Telegram Bot API
    await new Promise(r => setTimeout(r, 35))
  }

  console.log(`[ProcessNotifications] Done: sent ${sent}, failed ${failed}`)

  return {
    processed: queue.length,
    sent,
    failed
  }
})
