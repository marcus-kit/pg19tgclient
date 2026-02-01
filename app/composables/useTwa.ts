import { ref, computed } from 'vue'
import {
  init,
  backButton,
  hapticFeedback,
  miniApp,
  qrScanner,
  retrieveLaunchParams,
  type LaunchParams,
} from '@telegram-apps/sdk'

/**
 * Composable для работы с Telegram Mini App SDK v3
 * Обёртка над @telegram-apps/sdk для удобного использования в Vue
 */

// Инициализация SDK (один раз)
let initialized = false
let launchParams: LaunchParams | null = null

function initSdk() {
  if (initialized) return

  try {
    // Инициализируем SDK
    init()

    // Получаем launch params
    launchParams = retrieveLaunchParams()

    // Монтируем компоненты которые требуют mount
    if (backButton.mount.isAvailable()) {
      backButton.mount()
    }

    initialized = true
  }
  catch (e) {
    console.warn('[useTwa] SDK initialization failed:', e)
    // Не в Telegram окружении
  }
}

export function useTwa() {
  // Инициализируем при первом вызове
  initSdk()

  // Реактивное значение для isVisible (синхронизируется при show/hide)
  const isBackButtonVisible = ref(
    initialized && backButton.isMounted() ? backButton.isVisible() : false,
  )

  // Computed значения
  const initDataRaw = computed(() => launchParams?.initDataRaw)
  const user = computed(() => launchParams?.initData?.user)
  const isReady = computed(() => !!launchParams?.initData)

  // Обёртка для haptic с проверкой доступности
  const haptic = {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred(style)
      }
    },
    selectionChanged: () => {
      if (hapticFeedback.selectionChanged.isAvailable()) {
        hapticFeedback.selectionChanged()
      }
    },
    notificationOccurred: (type: 'error' | 'success' | 'warning') => {
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred(type)
      }
    },
  }

  // Обёртка для backButton
  const backButtonWrapper = {
    show: () => {
      if (backButton.show.isAvailable()) {
        backButton.show()
        isBackButtonVisible.value = true
      }
    },
    hide: () => {
      if (backButton.hide.isAvailable()) {
        backButton.hide()
        isBackButtonVisible.value = false
      }
    },
    onClick: (fn: VoidFunction) => {
      if (backButton.onClick.isAvailable()) {
        return backButton.onClick(fn)
      }
      return () => {}
    },
    offClick: (fn: VoidFunction) => {
      if (backButton.off.isAvailable()) {
        backButton.off('click', fn)
      }
    },
    isVisible: isBackButtonVisible,
  }

  // Обёртка для miniApp
  const webApp = {
    close: (returnBack?: boolean) => {
      if (miniApp.close.isAvailable()) {
        miniApp.close(returnBack)
      }
    },
    ready: () => {
      if (miniApp.ready.isAvailable()) {
        miniApp.ready()
      }
    },
    initData: launchParams?.initDataRaw,
    initDataUnsafe: launchParams?.initData,
  }

  // Обёртка для QR сканера (SDK v3 API)
  const qrScannerWrapper = {
    /**
     * Открывает встроенный QR сканер Telegram
     * @param text - Текст подсказки для пользователя
     * @param validateFn - Функция валидации содержимого QR (по умолчанию проверяет pg19qr://)
     * @returns Promise<string> - содержимое QR-кода
     */
    open: async (text?: string, validateFn?: (content: string) => boolean): Promise<string> => {
      if (!qrScanner.open.isAvailable()) {
        throw new Error('QR Scanner not available')
      }

      const defaultValidate = (content: string) => content.startsWith('pg19qr://')
      const validate = validateFn || defaultValidate

      // SDK v3: capture принимает строку напрямую и возвращает boolean
      const result = await qrScanner.open({
        text: text || 'Наведите камеру на QR-код на экране компьютера',
        capture: (qr) => {
          console.log('[QrScanner] Captured:', qr)
          return validate(qr)
        },
      })

      if (!result) {
        throw new Error('QR Scanner closed without result')
      }

      return result
    },

    close: () => {
      if (qrScanner.close.isAvailable()) {
        qrScanner.close()
      }
    },

    isAvailable: () => qrScanner.open.isAvailable(),
  }

  return {
    // Основные объекты SDK
    webApp,
    backButton: backButtonWrapper,
    haptic,
    qrScanner: qrScannerWrapper,

    // Данные инициализации
    initData: initDataRaw,
    initDataRaw,
    user,
    isReady,

    // Сырой доступ к SDK (для продвинутого использования)
    raw: {
      backButton,
      hapticFeedback,
      miniApp,
      qrScanner,
    },
  }
}
