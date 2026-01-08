import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

/**
 * Rate Limiting Utility
 * In-memory store для ограничения частоты запросов
 * Подходит для single-instance deployment
 */

interface RateLimitEntry {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

// In-memory store для rate limiting
// Key: `${action}:${identifier}`
const rateLimitStore = new Map<string, RateLimitEntry>()

// Очистка старых записей каждые 5 минут
const CLEANUP_INTERVAL = 5 * 60 * 1000
const ENTRY_TTL = 15 * 60 * 1000 // 15 минут

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    // Удаляем записи старше 15 минут без блокировки
    if (now - entry.firstAttempt > ENTRY_TTL && !entry.blockedUntil) {
      rateLimitStore.delete(key)
    }
    // Удаляем истёкшие блокировки
    if (entry.blockedUntil && now > entry.blockedUntil) {
      rateLimitStore.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

interface RateLimitConfig {
  /** Максимум попыток в окне */
  maxAttempts: number
  /** Окно в миллисекундах */
  windowMs: number
  /** Время блокировки после превышения лимита (мс) */
  blockDurationMs: number
  /** Название действия для логирования */
  action: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  blockedUntil?: number
}

/**
 * Получает идентификатор клиента (IP или другой)
 */
export function getClientIdentifier(event: H3Event): string {
  // Cloudflare передаёт реальный IP клиента в этом заголовке
  const cfIp = getRequestHeader(event, 'cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }

  // Пробуем получить IP из заголовков (за прокси)
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = getRequestHeader(event, 'x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback на getRequestIP
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

/**
 * Проверяет rate limit для действия
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.action}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Проверяем блокировку
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      blockedUntil: entry.blockedUntil
    }
  }

  // Если нет записи или окно истекло - создаём новую
  if (!entry || now - entry.firstAttempt > config.windowMs) {
    entry = {
      count: 1,
      firstAttempt: now
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs
    }
  }

  // Увеличиваем счётчик
  entry.count++

  // Проверяем превышение лимита
  if (entry.count > config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs
    rateLimitStore.set(key, entry)

    console.warn(`[RateLimit] Blocked ${identifier} for action ${config.action}`)

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      blockedUntil: entry.blockedUntil
    }
  }

  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.firstAttempt + config.windowMs
  }
}

/**
 * Сбрасывает счётчик после успешной аутентификации
 */
export function resetRateLimit(identifier: string, action: string): void {
  const key = `${action}:${identifier}`
  rateLimitStore.delete(key)
}

// Предустановленные конфигурации
export const RATE_LIMIT_CONFIGS = {
  /** Login: 5 попыток за 15 минут, блокировка 30 минут */
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 минут
    blockDurationMs: 30 * 60 * 1000, // 30 минут
    action: 'login'
  } satisfies RateLimitConfig,

  /** SMS verification: 3 попытки за 5 минут */
  sms: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
    action: 'sms'
  } satisfies RateLimitConfig,

  /** Password reset: 3 попытки за 30 минут */
  passwordReset: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
    action: 'password_reset'
  } satisfies RateLimitConfig
} as const

/**
 * Middleware для rate limiting
 * Выбрасывает 429 ошибку при превышении лимита
 */
export function requireRateLimit(
  event: H3Event,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.login
): void {
  const identifier = getClientIdentifier(event)
  const result = checkRateLimit(identifier, config)

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Слишком много попыток. Попробуйте через ${Math.ceil(retryAfterSeconds / 60)} минут.`,
      data: {
        retryAfter: retryAfterSeconds
      }
    })
  }
}
