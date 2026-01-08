import crypto from 'crypto'

// Интерфейс данных от Telegram Login Widget
interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Верификация HMAC подписи от Telegram
function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...authData } = data

  // Формируем строку для проверки
  const dataCheckString = Object.keys(authData)
    .sort()
    .filter(key => authData[key as keyof typeof authData] !== undefined)
    .map(key => `${key}=${authData[key as keyof typeof authData]}`)
    .join('\n')

  // Создаём секретный ключ из токена бота
  const secretKey = crypto.createHash('sha256').update(botToken).digest()

  // Вычисляем HMAC
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  return hmac === hash
}

// Проверка что auth_date не устарел (не старше 1 часа)
function isAuthDateValid(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 3600 // 1 час
  return now - authDate < maxAge
}

export default defineEventHandler(async (event) => {
  // Rate limiting: 5 попыток за 15 минут
  requireRateLimit(event, RATE_LIMIT_CONFIGS.login)

  const config = useRuntimeConfig()
  const body = await readBody<TelegramAuthData>(event)

  // Проверяем наличие обязательных полей
  if (!body.id || !body.hash || !body.auth_date) {
    throw createError({
      statusCode: 400,
      message: 'Неверные данные авторизации'
    })
  }

  // Проверяем токен бота
  const botToken = config.telegramBotToken
  if (!botToken) {
    throw createError({
      statusCode: 500,
      message: 'Telegram бот не настроен'
    })
  }

  // Верифицируем подпись
  if (!verifyTelegramAuth(body, botToken)) {
    throw createError({
      statusCode: 401,
      message: 'Неверная подпись авторизации'
    })
  }

  // Проверяем актуальность авторизации
  if (!isAuthDateValid(body.auth_date)) {
    throw createError({
      statusCode: 401,
      message: 'Авторизация устарела, попробуйте снова'
    })
  }

  const supabase = useSupabaseServer()

  // Ищем пользователя по telegram_id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      middle_name,
      full_name,
      email,
      phone,
      telegram_id,
      telegram_username,
      status
    `)
    .eq('telegram_id', body.id.toString())
    .single()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Неверные учётные данные'
    })
  }

  // Проверяем статус пользователя
  if (user.status === 'suspended' || user.status === 'terminated') {
    throw createError({
      statusCode: 403,
      message: 'Ваш аккаунт заблокирован'
    })
  }

  // Получаем аккаунт пользователя
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select(`
      id,
      contract_number,
      balance,
      status,
      address_full,
      start_date
    `)
    .eq('user_id', user.id)
    .single()

  if (accountError || !account) {
    throw createError({
      statusCode: 401,
      message: 'Неверные учётные данные'
    })
  }

  // Получаем подписки с тарифами
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      services (
        id,
        name,
        type
      )
    `)
    .eq('account_id', account.id)
    .eq('status', 'active')

  // Определяем основной тариф (интернет)
  const internetSub = subscriptions?.find(s => s.services?.type === 'internet')
  const tariffName = internetSub?.services?.name || 'Не подключен'

  // Создаём сессию с httpOnly cookie
  await createUserSession(event, user.id, account.id, 'telegram', body.id.toString(), {
    telegram_username: body.username,
    telegram_photo: body.photo_url,
    auth_date: body.auth_date
  })

  // Сбрасываем rate limit после успешного входа
  const clientIp = getClientIdentifier(event)
  resetRateLimit(clientIp, 'login')

  // Обновляем telegram_username если изменился
  if (body.username && body.username !== user.telegram_username) {
    await supabase
      .from('users')
      .update({ telegram_username: body.username })
      .eq('id', user.id)
  }

  // Возвращаем данные для клиента
  return {
    success: true,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      middleName: user.middle_name,
      phone: user.phone || '',
      email: user.email || '',
      telegram: body.username || '',
      vkId: '',
      avatar: body.photo_url || null,
      birthDate: null
    },
    account: {
      contractNumber: account.contract_number,
      balance: account.balance, // в копейках
      status: account.status,
      tariff: tariffName,
      address: account.address_full || '',
      startDate: account.start_date
    }
  }
})
