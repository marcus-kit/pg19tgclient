// Simple in-memory cache with TTL
// Используется для кэширования проверок mute/ban чтобы снизить нагрузку на БД

interface CacheItem<T> {
  value: T
  expires: number // timestamp
}

const cache = new Map<string, CacheItem<unknown>>()

/**
 * Получить значение из кэша
 * @returns undefined если нет в кэше или истёк TTL
 */
export function getCached<T>(key: string): T | undefined {
  const item = cache.get(key)
  if (!item) return undefined

  if (Date.now() > item.expires) {
    cache.delete(key)
    return undefined
  }

  return item.value as T
}

/**
 * Записать значение в кэш
 * @param key Ключ кэша
 * @param value Значение для хранения
 * @param ttlSeconds Время жизни в секундах
 */
export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  cache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000
  })
}

/**
 * Удалить ключ из кэша
 */
export function deleteCache(key: string): void {
  cache.delete(key)
}

/**
 * Проверить наличие ключа в кэше (без проверки TTL)
 */
export function hasCache(key: string): boolean {
  return cache.has(key)
}

/**
 * Очистить весь кэш
 */
export function clearCache(): void {
  cache.clear()
}

// Периодическая очистка истёкших записей (каждые 5 минут)
setInterval(() => {
  const now = Date.now()
  for (const [key, item] of cache) {
    if (now > item.expires) {
      cache.delete(key)
    }
  }
}, 5 * 60 * 1000)
