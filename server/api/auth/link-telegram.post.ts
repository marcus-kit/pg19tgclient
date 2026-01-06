import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Интерфейс данных от Telegram Login Widget
interface TelegramLinkData {
  userId: number // ID пользователя в нашей системе
  telegramId: number
  telegramUsername?: string
  firstName: string
  lastName?: string
  photoUrl?: string
  authDate: number
  hash: string
}

// Верификация HMAC подписи от Telegram
function verifyTelegramAuth(data: Omit<TelegramLinkData, 'userId'>, botToken: string): boolean {
  const { hash, ...authData } = data

  // Приводим к формату Telegram (snake_case)
  const telegramData: Record<string, string | number> = {
    id: authData.telegramId,
    first_name: authData.firstName,
    auth_date: authData.authDate
  }
  if (authData.lastName) telegramData.last_name = authData.lastName
  if (authData.telegramUsername) telegramData.username = authData.telegramUsername
  if (authData.photoUrl) telegramData.photo_url = authData.photoUrl

  const dataCheckString = Object.keys(telegramData)
    .sort()
    .map(key => `${key}=${telegramData[key]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  return hmac === hash
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<TelegramLinkData>(event)

  // Проверяем наличие обязательных полей
  if (!body.userId || !body.telegramId || !body.hash || !body.authDate) {
    throw createError({
      statusCode: 400,
      message: 'Неверные данные'
    })
  }

  // Проверяем токен бота
  const botToken = config.telegramBotToken
  if (!botToken) {
    throw createError({
      statusCode: 500,
      message: 'Telegram бот не настроен'
    })
  }

  // Верифицируем подпись
  if (!verifyTelegramAuth(body, botToken)) {
    throw createError({
      statusCode: 401,
      message: 'Неверная подпись авторизации'
    })
  }

  // Подключаемся к Supabase с service role
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Проверяем, не привязан ли уже этот Telegram к другому аккаунту
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', body.telegramId.toString())
    .single()

  if (existingUser && existingUser.id !== body.userId) {
    throw createError({
      statusCode: 409,
      message: 'Этот Telegram уже привязан к другому аккаунту'
    })
  }

  // Обновляем пользователя
  const { error: updateError } = await supabase
    .from('users')
    .update({
      telegram_id: body.telegramId.toString(),
      telegram_username: body.telegramUsername || null
    })
    .eq('id', body.userId)

  if (updateError) {
    throw createError({
      statusCode: 500,
      message: 'Ошибка при привязке Telegram'
    })
  }

  return {
    success: true,
    telegramId: body.telegramId,
    telegramUsername: body.telegramUsername
  }
})
