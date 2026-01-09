/**
 * Community Chat Notifier
 * Отправка уведомлений о новых сообщениях через Telegram Bot API
 * Поддерживает как одиночные, так и batch-уведомления
 */

export interface NotificationPayload {
  telegramChatId: string
  roomName: string
  roomId: string
  senderName: string
  messagePreview: string
}

export interface BatchNotificationPayload {
  telegramChatId: string
  roomId: string
  roomName: string
  messageCount: number
  messagePreviews: Array<{
    sender_name: string
    preview: string
    content_type: string
  }>
}

export interface NotificationResult {
  success: boolean
  error?: string
}

/**
 * Экранирование HTML для Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Склонение слова "сообщение" по числу
 */
function getMessageWordForm(count: number): string {
  const lastTwo = count % 100
  const lastOne = count % 10

  if (lastTwo >= 11 && lastTwo <= 19) {
    return 'новых сообщений'
  }

  if (lastOne === 1) {
    return 'новое сообщение'
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return 'новых сообщения'
  }

  return 'новых сообщений'
}

/**
 * Отправка уведомления о новом сообщении через Telegram Bot API
 * (Legacy - для одиночных сообщений, используется как fallback)
 */
export async function sendCommunityNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken

  if (!botToken) {
    console.warn('[CommunityNotifier] Bot token not configured')
    return { success: false, error: 'Bot token not configured' }
  }

  // URL для открытия TWA в нужной комнате
  const webAppUrl = config.public.twaUrl || 'https://pg19-tg.doka.team'

  // Формируем текст уведомления
  const text = `📬 <b>${escapeHtml(payload.roomName)}</b>\n\n` +
    `<b>${escapeHtml(payload.senderName)}:</b>\n` +
    `${escapeHtml(payload.messagePreview)}`

  // Inline-кнопка для открытия чата
  const keyboard = {
    inline_keyboard: [[{
      text: '💬 Открыть чат',
      web_app: { url: `${webAppUrl}/community?room=${payload.roomId}` }
    }]]
  }

  try {
    const response = await $fetch<{ ok: boolean; description?: string }>(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        body: {
          chat_id: payload.telegramChatId,
          text,
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      }
    )

    if (!response.ok) {
      return { success: false, error: response.description || 'Unknown Telegram error' }
    }

    return { success: true }
  } catch (e: any) {
    // Логируем, но не падаем — уведомления не критичны
    console.error('[CommunityNotifier] Failed to send:', payload.telegramChatId, e.message)
    return { success: false, error: e.message }
  }
}

/**
 * Отправка batch-уведомления (несколько сообщений объединены в одно)
 * Используется для отложенных уведомлений из очереди
 */
export async function sendBatchNotification(
  payload: BatchNotificationPayload
): Promise<NotificationResult> {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken

  if (!botToken) {
    console.warn('[CommunityNotifier] Bot token not configured')
    return { success: false, error: 'Bot token not configured' }
  }

  const webAppUrl = config.public.twaUrl || 'https://pg19-tg.doka.team'

  // Формируем текст уведомления
  let text = `📬 <b>${escapeHtml(payload.roomName)}</b>\n\n`

  if (payload.messageCount === 1 && payload.messagePreviews.length === 1) {
    // Одно сообщение - простой формат
    const msg = payload.messagePreviews[0]
    const icon = msg.content_type === 'image' ? '📷 ' : ''
    text += `<b>${escapeHtml(msg.sender_name)}:</b>\n`
    text += `${icon}${escapeHtml(msg.preview)}`
  } else {
    // Несколько сообщений - batch формат
    const wordForm = getMessageWordForm(payload.messageCount)
    text += `${payload.messageCount} ${wordForm}:\n`

    for (const msg of payload.messagePreviews) {
      const icon = msg.content_type === 'image' ? '📷 ' : ''
      text += `• <b>${escapeHtml(msg.sender_name)}:</b> ${icon}${escapeHtml(msg.preview)}...\n`
    }

    // Если есть ещё сообщения кроме показанных
    if (payload.messageCount > payload.messagePreviews.length) {
      const extra = payload.messageCount - payload.messagePreviews.length
      text += `<i>...и ещё ${extra}</i>`
    }
  }

  // Inline-кнопка для открытия чата
  const keyboard = {
    inline_keyboard: [[{
      text: '💬 Открыть чат',
      web_app: { url: `${webAppUrl}/community?room=${payload.roomId}` }
    }]]
  }

  try {
    const response = await $fetch<{ ok: boolean; description?: string }>(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        body: {
          chat_id: payload.telegramChatId,
          text,
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      }
    )

    if (!response.ok) {
      return { success: false, error: response.description || 'Unknown Telegram error' }
    }

    return { success: true }
  } catch (e: any) {
    console.error('[CommunityNotifier] Batch send failed:', payload.telegramChatId, e.message)
    return { success: false, error: e.message }
  }
}

/**
 * Отправка уведомлений нескольким пользователям (fire-and-forget)
 * Возвращает Promise который резолвится когда все отправлены
 * (Legacy - для instant режима, оставлен для совместимости)
 */
export async function sendCommunityNotifications(
  payloads: NotificationPayload[]
): Promise<{ sent: number; failed: number }> {
  if (!payloads.length) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  // Отправляем параллельно, но с небольшой задержкой для rate limiting
  const results = await Promise.allSettled(
    payloads.map(async (payload, index) => {
      // Небольшая задержка между запросами (30 msg/sec max)
      if (index > 0) {
        await new Promise(r => setTimeout(r, 35 * index))
      }
      return sendCommunityNotification(payload)
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
    }
  }

  return { sent, failed }
}
