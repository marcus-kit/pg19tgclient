/**
 * TWA Auth Middleware
 * Автоматическая авторизация через Telegram Web App initData
 */

// Ожидание загрузки Telegram WebApp SDK
const waitForTelegramWebApp = (timeout = 3000): Promise<any> => {
  return new Promise((resolve) => {
    // Если уже загружен
    if (window.Telegram?.WebApp) {
      resolve(window.Telegram.WebApp)
      return
    }

    const startTime = Date.now()

    const check = () => {
      if (window.Telegram?.WebApp) {
        resolve(window.Telegram.WebApp)
        return
      }

      if (Date.now() - startTime > timeout) {
        resolve(null)
        return
      }

      requestAnimationFrame(check)
    }

    check()
  })
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Только на клиенте
  if (import.meta.server) return

  // Публичные страницы, не требующие авторизации
  const publicRoutes = ['/twa-required', '/twa-link-account', '/twa-debug']
  if (publicRoutes.includes(to.path)) return

  const authStore = useAuthStore()

  // Гидратация store из localStorage
  if (!authStore.isAuthenticated) {
    authStore.hydrate()
  }

  // Проверяем наличие сессионного cookie
  // Даже если store авторизован, нужно убедиться что сессия существует
  const sessionCookie = useCookie('pg19_session')
  const hasSession = !!sessionCookie.value

  // Если есть и данные в store и cookie сессии - пропускаем
  if (authStore.isAuthenticated && hasSession) return

  // Ждём загрузки Telegram WebApp SDK (до 3 секунд)
  const webApp = await waitForTelegramWebApp(3000)

  // Если не в Telegram - редирект на страницу ошибки
  if (!webApp) {
    console.error('[TWA Auth] Telegram WebApp not available')
    return navigateTo('/twa-required')
  }

  // Получаем initData для авторизации
  const initData = webApp.initData
  if (!initData) {
    console.error('[TWA Auth] No initData available')
    return navigateTo('/twa-required')
  }

  try {
    const response = await $fetch<{
      success: boolean
      user: any
      account: any
    }>('/api/auth/telegram-webapp', {
      method: 'POST',
      body: { initData }
    })

    if (response.success) {
      await authStore.setAuthData(response.user, response.account)
    }
  } catch (e: any) {
    console.error('[TWA Auth] Authentication failed:', e.data?.message || e.message)

    // Если аккаунт не привязан к Telegram
    if (e.data?.statusCode === 404) {
      return navigateTo('/twa-link-account')
    }

    // Другие ошибки
    return navigateTo('/twa-required')
  }
})
