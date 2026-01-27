/**
 * Composable для авторизации на веб-сайте через QR-код
 *
 * Flow:
 * 1. startScan() - открывает QR сканер Telegram
 * 2. После сканирования - отправляет запрос на /api/auth/qr/scan/{token}
 * 3. confirmLogin() - подтверждает вход на /api/auth/qr/confirm/{token}
 */

interface DeviceInfo {
  ip: string
  browser: string
  os: string
  userAgent: string
}

interface QrLoginState {
  status: 'idle' | 'scanning' | 'scanned' | 'confirming' | 'success' | 'error'
  token: string | null
  deviceInfo: DeviceInfo | null
  error: string | null
}

export function useQrLogin() {
  const { qrScanner, haptic, initData } = useTwa()

  const state = reactive<QrLoginState>({
    status: 'idle',
    token: null,
    deviceInfo: null,
    error: null
  })

  /**
   * Открывает сканер и обрабатывает QR-код
   */
  async function startScan(): Promise<void> {
    if (!qrScanner.isAvailable()) {
      state.error = 'QR сканер недоступен'
      state.status = 'error'
      return
    }

    state.status = 'scanning'
    state.error = null

    try {
      // Открываем сканер и ждём результат
      // Валидация pg19qr:// происходит внутри qrScanner.open()
      const qrContent = await qrScanner.open()

      // Парсим токен из QR
      const token = qrContent.replace('pg19qr://', '')

      if (token.length !== 32) {
        throw new Error('Неверный формат QR-кода')
      }

      state.token = token
      state.status = 'scanned'
      haptic.notificationOccurred('success')

      // Отправляем запрос на сервер
      const response = await $fetch<{ success: boolean; deviceInfo: DeviceInfo }>(
        `https://pg19v3client.doka.team/api/auth/qr/scan/${token}`,
        {
          method: 'POST',
          body: { initData: initData.value }
        }
      )

      state.deviceInfo = response.deviceInfo
    } catch (e: any) {
      state.error = e.data?.message || e.message || 'Ошибка сканирования'
      state.status = 'error'
      haptic.notificationOccurred('error')
    }
  }

  /**
   * Подтверждает вход на веб-сайте
   */
  async function confirmLogin(): Promise<void> {
    if (!state.token) {
      state.error = 'Токен не найден'
      return
    }

    state.status = 'confirming'

    try {
      await $fetch(`https://pg19v3client.doka.team/api/auth/qr/confirm/${state.token}`, {
        method: 'POST',
        body: { initData: initData.value }
      })

      state.status = 'success'
      haptic.notificationOccurred('success')
    } catch (e: any) {
      state.error = e.data?.message || e.message || 'Ошибка подтверждения'
      state.status = 'error'
      haptic.notificationOccurred('error')
    }
  }

  /**
   * Отменяет процесс
   */
  function cancel(): void {
    qrScanner.close()
    state.status = 'idle'
    state.token = null
    state.deviceInfo = null
    state.error = null
  }

  /**
   * Сбрасывает состояние
   */
  function reset(): void {
    cancel()
  }

  return {
    // State
    status: computed(() => state.status),
    token: computed(() => state.token),
    deviceInfo: computed(() => state.deviceInfo),
    error: computed(() => state.error),
    isAvailable: computed(() => qrScanner.isAvailable()),

    // Actions
    startScan,
    confirmLogin,
    cancel,
    reset
  }
}
