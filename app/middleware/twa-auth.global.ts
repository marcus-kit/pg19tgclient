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

  // Гидратация store из localStorage для быстрого отображения UI
  if (!authStore.isAuthenticated) {
    authStore.hydrate()
  }

  // Ждём загрузки Telegram WebApp SDK (до 3 секунд)
  const webApp = await waitForTelegramWebApp(3000)

  // Если не в Telegram - редирект на страницу ошибки
  if (!webApp) {
    // Но если есть данные в localStorage - доверяем им (refresh вне Telegram)
    if (authStore.isAuthenticated && authStore.user?.id) {
      console.log('[TWA Auth] Using cached auth data')
      return
    }
    console.error('[TWA Auth] Telegram WebApp not available')
    return navigateTo('/twa-required')
  }

  // Получаем initData для авторизации
  const initData = webApp.initData
  if (!initData) {
    // Если есть localStorage данные - доверяем им (refresh внутри Telegram)
    if (authStore.isAuthenticated && authStore.user?.id) {
      console.log('[TWA Auth] Using cached auth data (no initData)')
      return
    }
    console.error('[TWA Auth] No initData available')
    return navigateTo('/twa-required')
  }

  // Если уже авторизованы в localStorage - не блокируем навигацию
  const hasLocalAuth = authStore.isAuthenticated && authStore.user?.id

  if (hasLocalAuth) {
    // Обновляем данные в фоне, не блокируя навигацию
    $fetch<{
      success: boolean
      user: any
      account: any
    }>('/api/auth/telegram-webapp', {
      method: 'POST',
      body: { initData }
    }).then((response) => {
      if (response.success) {
        authStore.setAuthData(response.user, response.account)
      }
    }).catch((e) => {
      // Игнорируем ошибки при фоновом обновлении
      console.warn('[TWA Auth] Background refresh failed:', e.data?.message || e.message)
    })
    return
  }

  // Первичная авторизация - блокируем до получения данных
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

    // Если аккаунт не привязан к Telegram - показываем страницу привязки
    if (e.data?.statusCode === 404) {
      return navigateTo('/twa-link-account')
    }

    return navigateTo('/twa-required')
  }
})
