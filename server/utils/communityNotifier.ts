/**
 * Community Chat Notifier
 * Отправка уведомлений о новых сообщениях через Telegram Bot API
 */

export interface NotificationPayload {
  telegramChatId: string
  roomName: string
  roomId: string
  senderName: string
  messagePreview: string
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
 * Отправка уведомления о новом сообщении через Telegram Bot API
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
 * Отправка уведомлений нескольким пользователям (fire-and-forget)
 * Возвращает Promise который резолвится когда все отправлены
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
