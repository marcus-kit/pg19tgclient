/**
 * In-memory Rate Limiter для защиты от спама
 *
 * Использует sliding window алгоритм:
 * - Хранит timestamps последних действий для каждого ключа
 * - Автоматически очищает старые записи
 *
 * Пример использования:
 *   const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 })
 *   if (!limiter.check('user:123')) {
 *     throw createError({ statusCode: 429, message: 'Too many requests' })
 *   }
 */

interface RateLimitOptions {
  /** Окно времени в миллисекундах (default: 60000 = 1 минута) */
  windowMs?: number
  /** Максимум запросов в окне (default: 5) */
  maxRequests?: number
  /** Интервал очистки старых записей в мс (default: 60000) */
  cleanupIntervalMs?: number
}

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimiter {
  /** Проверить и записать запрос. Возвращает true если разрешено */
  check: (key: string) => boolean
  /** Получить оставшееся количество запросов */
  remaining: (key: string) => number
  /** Получить время до сброса в мс */
  resetIn: (key: string) => number
  /** Очистить все записи */
  clear: () => void
}

const limiters = new Map<string, Map<string, RateLimitEntry>>()

export function createRateLimiter(
  name: string,
  options: RateLimitOptions = {}
): RateLimiter {
  const {
    windowMs = 60000,
    maxRequests = 5,
    cleanupIntervalMs = 60000
  } = options

  // Получаем или создаём store для этого лимитера
  if (!limiters.has(name)) {
    limiters.set(name, new Map<string, RateLimitEntry>())

    // Периодическая очистка старых записей
    setInterval(() => {
      const store = limiters.get(name)
      if (!store) return

      const now = Date.now()
      const cutoff = now - windowMs

      for (const [key, entry] of store) {
        // Удаляем старые timestamps
        entry.timestamps = entry.timestamps.filter(ts => ts > cutoff)

        // Удаляем пустые записи
        if (entry.timestamps.length === 0) {
          store.delete(key)
        }
      }
    }, cleanupIntervalMs)
  }

  const store = limiters.get(name)!

  return {
    check(key: string): boolean {
      const now = Date.now()
      const cutoff = now - windowMs

      let entry = store.get(key)
      if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
      }

      // Удаляем старые timestamps
      entry.timestamps = entry.timestamps.filter(ts => ts > cutoff)

      // Проверяем лимит
      if (entry.timestamps.length >= maxRequests) {
        return false
      }

      // Записываем новый timestamp
      entry.timestamps.push(now)
      return true
    },

    remaining(key: string): number {
      const now = Date.now()
      const cutoff = now - windowMs

      const entry = store.get(key)
      if (!entry) return maxRequests

      const validTimestamps = entry.timestamps.filter(ts => ts > cutoff)
      return Math.max(0, maxRequests - validTimestamps.length)
    },

    resetIn(key: string): number {
      const now = Date.now()
      const cutoff = now - windowMs

      const entry = store.get(key)
      if (!entry || entry.timestamps.length === 0) return 0

      // Находим самый старый timestamp в окне
      const validTimestamps = entry.timestamps.filter(ts => ts > cutoff)
      if (validTimestamps.length === 0) return 0

      const oldest = Math.min(...validTimestamps)
      return Math.max(0, oldest + windowMs - now)
    },

    clear(): void {
      store.clear()
    }
  }
}

// Pre-configured limiters для community chat
export const communityMessageLimiter = createRateLimiter('community:messages', {
  windowMs: 60000, // 1 минута
  maxRequests: 10  // 10 сообщений в минуту
})

export const communityImageLimiter = createRateLimiter('community:images', {
  windowMs: 300000, // 5 минут
  maxRequests: 5    // 5 изображений за 5 минут
})
