/**
 * Composable для работы с Telegram Web App API
 * Предоставляет реактивный доступ к функциям TWA
 */
export function useTelegramWebApp() {
  const isInTelegram = ref(false)
  const isReady = ref(false)

  // Получение WebApp объекта
  const getWebApp = (): TelegramWebApp | null => {
    if (typeof window === 'undefined') return null
    return window.Telegram?.WebApp || null
  }

  // Проверка окружения при монтировании
  onMounted(() => {
    const webApp = getWebApp()
    isInTelegram.value = !!webApp
    isReady.value = !!webApp

    // Инициализация fullscreen состояния (Bot API 8.0+)
    if (webApp) {
      isFullscreen.value = webApp.isFullscreen || false

      // Подписываемся на события fullscreen
      webApp.onEvent('fullscreenChanged', () => {
        isFullscreen.value = webApp.isFullscreen
      })
    }
  })

  // Получение initData для авторизации на сервере
  const getInitData = (): string | null => {
    return getWebApp()?.initData || null
  }

  // Получение распарсенных данных пользователя
  const getInitDataUnsafe = (): TelegramWebAppInitData | null => {
    return getWebApp()?.initDataUnsafe || null
  }

  // Получение данных пользователя
  const getUser = (): TelegramWebAppUser | null => {
    return getWebApp()?.initDataUnsafe?.user || null
  }

  // Информация о платформе
  const platform = computed(() => getWebApp()?.platform || 'unknown')
  const colorScheme = computed(() => getWebApp()?.colorScheme || 'dark')
  const version = computed(() => getWebApp()?.version || '0.0')

  // ========== BackButton ==========
  const showBackButton = (onClick: () => void) => {
    const webApp = getWebApp()
    if (!webApp) return

    webApp.BackButton.onClick(onClick)
    webApp.BackButton.show()
  }

  const hideBackButton = () => {
    const webApp = getWebApp()
    if (!webApp) return

    webApp.BackButton.hide()
  }

  const offBackButton = (onClick: () => void) => {
    const webApp = getWebApp()
    if (!webApp) return

    webApp.BackButton.offClick(onClick)
  }

  // ========== MainButton ==========
  let mainButtonCallback: (() => void) | null = null

  const showMainButton = (text: string, onClick: () => void) => {
    const webApp = getWebApp()
    if (!webApp) return

    // Убираем предыдущий обработчик если есть
    if (mainButtonCallback) {
      webApp.MainButton.offClick(mainButtonCallback)
    }

    mainButtonCallback = onClick
    webApp.MainButton.setText(text)
    webApp.MainButton.onClick(onClick)
    webApp.MainButton.show()
  }

  const hideMainButton = () => {
    const webApp = getWebApp()
    if (!webApp) return

    if (mainButtonCallback) {
      webApp.MainButton.offClick(mainButtonCallback)
      mainButtonCallback = null
    }
    webApp.MainButton.hide()
  }

  const setMainButtonText = (text: string) => {
    getWebApp()?.MainButton.setText(text)
  }

  const setMainButtonLoading = (loading: boolean) => {
    const webApp = getWebApp()
    if (!webApp) return

    if (loading) {
      webApp.MainButton.showProgress()
      webApp.MainButton.disable()
    } else {
      webApp.MainButton.hideProgress()
      webApp.MainButton.enable()
    }
  }

  const enableMainButton = () => {
    getWebApp()?.MainButton.enable()
  }

  const disableMainButton = () => {
    getWebApp()?.MainButton.disable()
  }

  // ========== HapticFeedback ==========
  const hapticImpact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    getWebApp()?.HapticFeedback.impactOccurred(style)
  }

  const hapticNotification = (type: 'success' | 'warning' | 'error') => {
    getWebApp()?.HapticFeedback.notificationOccurred(type)
  }

  const hapticSelection = () => {
    getWebApp()?.HapticFeedback.selectionChanged()
  }

  // ========== App Control ==========
  const closeApp = () => {
    getWebApp()?.close()
  }

  const expandApp = () => {
    getWebApp()?.expand()
  }

  // ========== Fullscreen (Bot API 8.0+) ==========
  const isFullscreen = ref(false)

  // Проверка поддержки fullscreen (версия >= 8.0)
  const supportsFullscreen = computed(() => {
    const webApp = getWebApp()
    if (!webApp?.version) return false
    const [major] = webApp.version.split('.').map(Number)
    return major >= 8
  })

  // Запрос fullscreen
  const requestFullscreen = async (): Promise<boolean> => {
    const webApp = getWebApp()
    if (!webApp || !supportsFullscreen.value) {
      console.warn('[TWA] Fullscreen not supported')
      return false
    }

    if (webApp.isFullscreen) {
      return true
    }

    try {
      await webApp.requestFullscreen()
      hapticNotification('success')
      return true
    } catch (e) {
      console.error('[TWA] requestFullscreen failed:', e)
      hapticNotification('error')
      return false
    }
  }

  // Выход из fullscreen
  const exitFullscreen = async (): Promise<boolean> => {
    const webApp = getWebApp()
    if (!webApp || !supportsFullscreen.value) {
      return false
    }

    if (!webApp.isFullscreen) {
      return true
    }

    try {
      await webApp.exitFullscreen()
      hapticImpact('light')
      return true
    } catch (e) {
      console.error('[TWA] exitFullscreen failed:', e)
      return false
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = async (): Promise<boolean> => {
    if (isFullscreen.value) {
      return exitFullscreen()
    }
    return requestFullscreen()
  }

  // ========== Viewport ==========
  const viewportHeight = computed(() => getWebApp()?.viewportHeight || window?.innerHeight || 0)
  const viewportStableHeight = computed(() => getWebApp()?.viewportStableHeight || window?.innerHeight || 0)

  const safeAreaInsets = computed(() => {
    const webApp = getWebApp()
    return webApp?.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 }
  })

  const contentSafeAreaInsets = computed(() => {
    const webApp = getWebApp()
    return webApp?.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 }
  })

  // ========== Theme ==========
  const themeParams = computed(() => {
    return getWebApp()?.themeParams || {}
  })

  const isDark = computed(() => colorScheme.value === 'dark')

  return {
    // State
    isInTelegram: readonly(isInTelegram),
    isReady: readonly(isReady),

    // Data
    getInitData,
    getInitDataUnsafe,
    getUser,
    platform,
    version,
    colorScheme,
    isDark,

    // BackButton
    showBackButton,
    hideBackButton,
    offBackButton,

    // MainButton
    showMainButton,
    hideMainButton,
    setMainButtonText,
    setMainButtonLoading,
    enableMainButton,
    disableMainButton,

    // Haptic
    hapticImpact,
    hapticNotification,
    hapticSelection,

    // App control
    closeApp,
    expandApp,

    // Fullscreen (Bot API 8.0+)
    isFullscreen: readonly(isFullscreen),
    supportsFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,

    // Viewport
    viewportHeight,
    viewportStableHeight,
    safeAreaInsets,
    contentSafeAreaInsets,

    // Theme
    themeParams
  }
}
