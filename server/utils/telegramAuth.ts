/**
 * Telegram WebApp InitData Validation
 * Валидация по официальной документации Telegram
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
import { createHmac } from 'node:crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  allows_write_to_pm?: boolean
}

export interface ParsedInitData {
  query_id?: string
  user?: TelegramUser
  auth_date: number
  hash: string
  start_param?: string
  chat_type?: string
  chat_instance?: string
}

/**
 * Парсит initData строку в объект
 */
export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData)
  const result: Record<string, any> = {}

  for (const [key, value] of params.entries()) {
    if (key === 'user' || key === 'chat' || key === 'receiver') {
      try {
        result[key] = JSON.parse(value)
      } catch {
        result[key] = value
      }
    } else if (key === 'auth_date') {
      result[key] = parseInt(value, 10)
    } else {
      result[key] = value
    }
  }

  return result as ParsedInitData
}

/**
 * Валидирует подпись initData
 * @param initData - строка initData от Telegram
 * @param botToken - токен бота
 * @param expiresIn - время жизни в секундах (0 = без ограничения)
 * @returns true если валидно
 * @throws Error если невалидно
 */
export function validateInitData(
  initData: string,
  botToken: string,
  expiresIn: number = 86400
): boolean {
  if (!initData || !botToken) {
    throw new Error('Missing initData or botToken')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) {
    throw new Error('Missing hash in initData')
  }

  // Удаляем hash и сортируем оставшиеся параметры
  params.delete('hash')
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // Создаём secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  // Создаём hash = HMAC_SHA256(data_check_string, secret_key)
  const calculatedHash = createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex')

  // Сравниваем хеши
  if (calculatedHash !== hash) {
    throw new Error('Invalid initData signature')
  }

  // Проверяем срок действия
  if (expiresIn > 0) {
    const authDate = params.get('auth_date')
    if (!authDate) {
      throw new Error('Missing auth_date in initData')
    }

    const authTimestamp = parseInt(authDate, 10)
    const now = Math.floor(Date.now() / 1000)

    if (now - authTimestamp > expiresIn) {
      throw new Error('InitData expired')
    }
  }

  return true
}

/**
 * Удобная функция проверки без выброса исключений
 */
export function isInitDataValid(
  initData: string,
  botToken: string,
  expiresIn: number = 86400
): boolean {
  try {
    return validateInitData(initData, botToken, expiresIn)
  } catch {
    return false
  }
}
