/**
 * Telegram Web App Plugin
 * Инициализирует TWA SDK и настраивает приложение
 */
import { init } from '@tma.js/sdk-vue'

export default defineNuxtPlugin(() => {
  // Проверяем что мы внутри Telegram
  if (typeof window === 'undefined') {
    return
  }

  const WebApp = window.Telegram?.WebApp
  if (!WebApp) {
    console.warn('[TWA] Not running inside Telegram WebApp')
    return
  }

  try {
    // Инициализируем SDK
    init()

    // Расширяем viewport на всю высоту
    WebApp.expand()

    // Отключаем сворачивание при свайпе вниз
    if (WebApp.disableVerticalSwipes) {
      WebApp.disableVerticalSwipes()
    }

    // Уведомляем Telegram что приложение готово
    WebApp.ready()

    // Запрашиваем fullscreen режим (Bot API 8.0+)
    // Работает как fallback если в BotFather не настроено
    if (WebApp.requestFullscreen && !WebApp.isFullscreen) {
      // Небольшая задержка чтобы Telegram успел инициализироваться
      setTimeout(() => {
        WebApp.requestFullscreen().catch(() => {
          // Игнорируем ошибки - fullscreen может быть недоступен
        })
      }, 100)
    }

    // Устанавливаем CSS переменные для safe area
    document.documentElement.style.setProperty(
      '--twa-safe-top',
      `${WebApp.safeAreaInset?.top || 0}px`
    )
    document.documentElement.style.setProperty(
      '--twa-safe-bottom',
      `${WebApp.safeAreaInset?.bottom || 0}px`
    )
    document.documentElement.style.setProperty(
      '--twa-safe-left',
      `${WebApp.safeAreaInset?.left || 0}px`
    )
    document.documentElement.style.setProperty(
      '--twa-safe-right',
      `${WebApp.safeAreaInset?.right || 0}px`
    )
    document.documentElement.style.setProperty(
      '--twa-content-safe-top',
      `${WebApp.contentSafeAreaInset?.top || 0}px`
    )
    document.documentElement.style.setProperty(
      '--twa-content-safe-bottom',
      `${WebApp.contentSafeAreaInset?.bottom || 0}px`
    )

    // Устанавливаем CSS переменные для темы Telegram
    const themeParams = WebApp.themeParams
    if (themeParams) {
      document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#1c1c1e')
      document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#ffffff')
      document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#8e8e93')
      document.documentElement.style.setProperty('--tg-link-color', themeParams.link_color || '#007aff')
      document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#007aff')
      document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff')
      document.documentElement.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#2c2c2e')
      document.documentElement.style.setProperty('--tg-header-bg-color', themeParams.header_bg_color || '#1c1c1e')
      document.documentElement.style.setProperty('--tg-section-bg-color', themeParams.section_bg_color || '#2c2c2e')
      document.documentElement.style.setProperty('--tg-accent-text-color', themeParams.accent_text_color || '#007aff')
      document.documentElement.style.setProperty('--tg-destructive-text-color', themeParams.destructive_text_color || '#ff3b30')
    }

    // Слушаем изменения темы
    WebApp.onEvent('themeChanged', () => {
      const params = WebApp.themeParams
      if (params) {
        document.documentElement.style.setProperty('--tg-bg-color', params.bg_color || '#1c1c1e')
        document.documentElement.style.setProperty('--tg-text-color', params.text_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-hint-color', params.hint_color || '#8e8e93')
        document.documentElement.style.setProperty('--tg-secondary-bg-color', params.secondary_bg_color || '#2c2c2e')
      }
    })

    // Слушаем изменения viewport
    WebApp.onEvent('viewportChanged', ({ isStateStable }) => {
      if (isStateStable) {
        document.documentElement.style.setProperty('--twa-viewport-height', `${WebApp.viewportStableHeight}px`)
      }
    })

    // Слушаем изменения fullscreen (Bot API 8.0+)
    WebApp.onEvent('fullscreenChanged', () => {
      document.documentElement.classList.toggle('twa-fullscreen', WebApp.isFullscreen)
      console.log('[TWA] Fullscreen changed:', WebApp.isFullscreen)
    })

    // Слушаем изменения safe area (важно для fullscreen!)
    WebApp.onEvent('safeAreaChanged', () => {
      document.documentElement.style.setProperty(
        '--twa-safe-top',
        `${WebApp.safeAreaInset?.top || 0}px`
      )
      document.documentElement.style.setProperty(
        '--twa-safe-bottom',
        `${WebApp.safeAreaInset?.bottom || 0}px`
      )
      document.documentElement.style.setProperty(
        '--twa-safe-left',
        `${WebApp.safeAreaInset?.left || 0}px`
      )
      document.documentElement.style.setProperty(
        '--twa-safe-right',
        `${WebApp.safeAreaInset?.right || 0}px`
      )
    })

    // Слушаем изменения content safe area
    WebApp.onEvent('contentSafeAreaChanged', () => {
      document.documentElement.style.setProperty(
        '--twa-content-safe-top',
        `${WebApp.contentSafeAreaInset?.top || 0}px`
      )
      document.documentElement.style.setProperty(
        '--twa-content-safe-bottom',
        `${WebApp.contentSafeAreaInset?.bottom || 0}px`
      )
    })

    console.log('[TWA] Initialized successfully')
  } catch (error) {
    console.error('[TWA] Initialization failed:', error)
  }
})

// Типы для window.Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }

  interface TelegramWebApp {
    initData: string
    initDataUnsafe: TelegramWebAppInitData
    version: string
    platform: string
    colorScheme: 'light' | 'dark'
    themeParams: TelegramThemeParams
    isExpanded: boolean
    viewportHeight: number
    viewportStableHeight: number
    safeAreaInset?: { top: number; bottom: number; left: number; right: number }
    contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number }
    BackButton: TelegramBackButton
    MainButton: TelegramMainButton
    HapticFeedback: TelegramHapticFeedback
    // Fullscreen API (Bot API 8.0+)
    isFullscreen: boolean
    requestFullscreen(): Promise<void>
    exitFullscreen(): Promise<void>
    // Swipe control (Bot API 7.7+)
    isVerticalSwipesEnabled: boolean
    disableVerticalSwipes(): void
    enableVerticalSwipes(): void
    ready(): void
    expand(): void
    close(): void
    onEvent(eventType: string, callback: (data?: any) => void): void
    offEvent(eventType: string, callback: (data?: any) => void): void
  }

  interface TelegramWebAppInitData {
    query_id?: string
    user?: TelegramWebAppUser
    auth_date: number
    hash: string
  }

  interface TelegramWebAppUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    photo_url?: string
  }

  interface TelegramThemeParams {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
    header_bg_color?: string
    section_bg_color?: string
    accent_text_color?: string
    destructive_text_color?: string
  }

  interface TelegramBackButton {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }

  interface TelegramMainButton {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    setParams(params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }): void
  }

  interface TelegramHapticFeedback {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
}

export {}
