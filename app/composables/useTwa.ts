import {
  backButton,
  hapticFeedback,
  miniApp,
  initData,
  retrieveLaunchParams,
  useSignal
} from '@tma.js/sdk-vue'

/**
 * Composable для работы с Telegram Mini App SDK
 * Обёртка над @tma.js/sdk-vue для удобного использования
 */
export function useTwa() {
  // Получаем launch params для доступа к initData
  let launchParams: ReturnType<typeof retrieveLaunchParams> | null = null
  try {
    launchParams = retrieveLaunchParams()
  } catch {
    // Не в Telegram окружении
  }

  // Реактивные сигналы
  const isBackButtonVisible = useSignal(backButton.isVisible)
  const isMiniAppMounted = useSignal(miniApp.isMounted)

  // Computed значения для совместимости с предыдущим API
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
    }
  }

  // Обёртка для backButton с проверкой доступности
  const backButtonWrapper = {
    show: () => {
      if (backButton.show.isAvailable()) {
        backButton.show()
      }
    },
    hide: () => {
      if (backButton.hide.isAvailable()) {
        backButton.hide()
      }
    },
    onClick: (fn: VoidFunction) => {
      if (backButton.onClick.isAvailable()) {
        return backButton.onClick(fn)
      }
      return () => {}
    },
    offClick: (fn: VoidFunction) => {
      if (backButton.offClick.isAvailable()) {
        backButton.offClick(fn)
      }
    },
    isVisible: isBackButtonVisible
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
    initDataUnsafe: launchParams?.initData
  }

  return {
    // Основные объекты SDK
    webApp,
    backButton: backButtonWrapper,
    haptic,

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
      initData
    }
  }
}
