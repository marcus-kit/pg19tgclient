import {
  useWebApp,
  useWebAppMainButton,
  useWebAppBackButton,
  useWebAppHapticFeedback,
  useWebAppPopup,
  useWebAppTheme
} from 'vue-tg'

export function useTwa() {
  const webApp = useWebApp()
  const mainButton = useWebAppMainButton()
  const backButton = useWebAppBackButton()
  const haptic = useWebAppHapticFeedback()
  const popup = useWebAppPopup()
  const theme = useWebAppTheme()

  const initData = computed(() => webApp.initData)
  const initDataRaw = computed(() => webApp.initDataUnsafe)
  const user = computed(() => webApp.initDataUnsafe?.user)
  const isReady = computed(() => !!webApp.initDataUnsafe)

  return {
    webApp,
    mainButton,
    backButton,
    haptic,
    popup,
    theme,
    initData,
    initDataRaw,
    user,
    isReady
  }
}
