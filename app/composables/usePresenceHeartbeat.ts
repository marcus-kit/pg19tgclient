/**
 * Heartbeat для поддержания онлайн-статуса пользователя
 *
 * Использование:
 *   const { startHeartbeat, stopHeartbeat } = usePresenceHeartbeat()
 *
 *   onMounted(() => startHeartbeat())
 *   onUnmounted(() => stopHeartbeat())
 */

export function usePresenceHeartbeat() {
  const authStore = useAuthStore()

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null

  const HEARTBEAT_INTERVAL = 30000 // 30 секунд

  // Отправить heartbeat
  async function sendHeartbeat(status: 'online' | 'away' = 'online') {
    if (!authStore.isAuthenticated) return

    try {
      await $fetch('/api/user/presence', {
        method: 'POST',
        body: { status }
      })
    } catch {
      // Игнорируем ошибки heartbeat
    }
  }

  // Пометить как offline
  async function markOffline() {
    if (!authStore.isAuthenticated) return

    try {
      await $fetch('/api/user/presence', {
        method: 'DELETE'
      })
    } catch {
      // Игнорируем ошибки
    }
  }

  // Обработчик видимости страницы
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      sendHeartbeat('online')
    } else {
      sendHeartbeat('away')
    }
  }

  // Запустить heartbeat
  function startHeartbeat() {
    if (!import.meta.client) return

    // Отправляем сразу при старте
    sendHeartbeat('online')

    // Периодический heartbeat
    heartbeatInterval = setInterval(() => {
      const status = document.visibilityState === 'visible' ? 'online' : 'away'
      sendHeartbeat(status)
    }, HEARTBEAT_INTERVAL)

    // Отслеживаем видимость страницы
    visibilityHandler = handleVisibilityChange
    document.addEventListener('visibilitychange', visibilityHandler)

    // Помечаем offline при закрытии страницы
    window.addEventListener('beforeunload', markOffline)
  }

  // Остановить heartbeat
  function stopHeartbeat() {
    if (!import.meta.client) return

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }

    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }

    window.removeEventListener('beforeunload', markOffline)

    // Помечаем offline при остановке
    markOffline()
  }

  return {
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat,
    markOffline
  }
}
