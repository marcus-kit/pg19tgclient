/**
 * Composable для авторизации на веб-сайте через QR-код
 *
 * Flow (через Supabase, без CORS):
 * 1. startScan() - открывает QR сканер Telegram
 * 2. После сканирования - обновляет запись в Supabase (status='scanned')
 * 3. Web client получает обновление через Realtime
 * 4. confirmLogin() - обновляет status='confirmed'
 * 5. Web client авторизует пользователя
 */

interface DeviceInfo {
  ip: string
  browser: string
  os: string
}

interface QrAuthRequest {
  id: string
  token: string
  status: string
  ip_address: string | null
  user_agent: string | null
  expires_at: string
}

interface QrLoginState {
  status: 'idle' | 'scanning' | 'scanned' | 'confirming' | 'success' | 'error'
  token: string | null
  deviceInfo: DeviceInfo | null
  error: string | null
}

/**
 * Парсит User-Agent для отображения браузера и ОС
 */
function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: 'Неизвестно', os: 'Неизвестно' }

  let browser = 'Браузер'
  let os = 'ОС'

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS'

  return { browser, os }
}

export function useQrLogin() {
  const supabase = useSupabaseClient()
  const { qrScanner, haptic, user } = useTwa()

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
      const qrContent = await qrScanner.open()

      // Парсим токен из QR
      const token = qrContent.replace('pg19qr://', '')

      if (token.length !== 32) {
        throw new Error('Неверный формат QR-кода')
      }

      state.token = token
      haptic.notificationOccurred('success')

      // Получаем запись из Supabase
      const { data: request, error: fetchError } = await supabase
        .from('qr_auth_requests')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (fetchError || !request) {
        throw new Error('QR-код недействителен или истёк')
      }

      // Обновляем статус на 'scanned'
      const { error: updateError } = await supabase
        .from('qr_auth_requests')
        .update({
          status: 'scanned',
          telegram_id: user.value?.id?.toString() || null,
          telegram_username: user.value?.username || null,
          scanned_at: new Date().toISOString()
        })
        .eq('token', token)

      if (updateError) {
        throw new Error('Ошибка обновления статуса')
      }

      // Отправляем broadcast через Realtime
      await supabase.channel(`qr-auth:${token}`).send({
        type: 'broadcast',
        event: 'scanned',
        payload: {
          telegramId: user.value?.id,
          telegramUsername: user.value?.username
        }
      })

      // Парсим device info из записи
      const { browser, os } = parseUserAgent(request.user_agent)
      state.deviceInfo = {
        ip: request.ip_address || 'Неизвестно',
        browser,
        os
      }

      state.status = 'scanned'
    } catch (e: any) {
      state.error = e.message || 'Ошибка сканирования'
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
      // Обновляем статус на 'confirmed'
      const { error: updateError } = await supabase
        .from('qr_auth_requests')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('token', state.token)
        .eq('status', 'scanned')

      if (updateError) {
        throw new Error('Ошибка подтверждения')
      }

      // Отправляем broadcast через Realtime
      await supabase.channel(`qr-auth:${state.token}`).send({
        type: 'broadcast',
        event: 'confirmed',
        payload: {
          telegramId: user.value?.id,
          telegramUsername: user.value?.username
        }
      })

      state.status = 'success'
      haptic.notificationOccurred('success')
    } catch (e: any) {
      state.error = e.message || 'Ошибка подтверждения'
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
