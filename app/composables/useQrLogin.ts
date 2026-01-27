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

      // Получаем QR-запрос из Supabase
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

      const telegramId = user.value?.id?.toString()
      if (!telegramId) {
        throw new Error('Не удалось получить Telegram ID')
      }

      // Ищем пользователя по telegram_id
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('id, status')
        .eq('telegram_id', telegramId)
        .single()

      if (userError || !dbUser) {
        throw new Error('Пользователь с этим Telegram не найден. Войдите по договору и привяжите Telegram в профиле.')
      }

      if (dbUser.status === 'suspended' || dbUser.status === 'terminated') {
        throw new Error('Ваш аккаунт заблокирован')
      }

      // Получаем account по user_id
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', dbUser.id)
        .single()

      if (accountError || !account) {
        throw new Error('Аккаунт не найден')
      }

      // Обновляем статус на 'scanned' с user_id и account_id
      const { error: updateError } = await supabase
        .from('qr_auth_requests')
        .update({
          status: 'scanned',
          user_id: dbUser.id,
          account_id: account.id,
          telegram_id: telegramId,
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
