/**
 * Telegram Web App Authentication Endpoint
 * Валидирует initData и авторизует пользователя
 */
import { createClient } from '@supabase/supabase-js'
import { validateInitData, parseInitData } from '../../utils/telegramAuth'
import { createUserSession } from '../../utils/userAuth'

interface TelegramWebAppAuthBody {
  initData: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<TelegramWebAppAuthBody>(event)

  // Проверяем наличие initData
  if (!body.initData) {
    throw createError({
      statusCode: 400,
      message: 'initData обязателен'
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

  try {
    console.log('[TWA Auth] Starting authentication...')

    // Валидация подписи initData (24 часа)
    validateInitData(body.initData, botToken, 86400)
    console.log('[TWA Auth] initData validated')

    // Парсим данные
    const initData = parseInitData(body.initData)
    const telegramUser = initData.user

    if (!telegramUser) {
      throw createError({
        statusCode: 400,
        message: 'Пользователь не найден в initData'
      })
    }

    // Подключаемся к Supabase с service role
    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey
    )

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
        avatar,
        nickname,
        status
      `)
      .eq('telegram_id', telegramUser.id.toString())
      .single()

    if (userError || !user) {
      throw createError({
        statusCode: 404,
        message: 'Аккаунт не привязан к Telegram. Войдите через сайт и привяжите Telegram в профиле.'
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
        statusCode: 404,
        message: 'Договор не найден'
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
    const internetSub = subscriptions?.find((s: any) => s.services?.type === 'internet')
    const tariffName = internetSub?.services?.name || 'Не подключен'

    // Создаём сессию с cookie
    console.log('[TWA Auth] Creating session for user:', user.id)
    await createUserSession(
      event,
      user.id,
      account.id,
      'telegram',
      telegramUser.id.toString(),
      {
        telegram_username: telegramUser.username,
        telegram_photo: telegramUser.photo_url,
        auth_date: initData.auth_date,
        platform: 'telegram_webapp'
      }
    )
    console.log('[TWA Auth] Session created successfully')

    // Обновляем telegram_username если изменился
    if (telegramUser.username && telegramUser.username !== user.telegram_username) {
      await supabase
        .from('users')
        .update({ telegram_username: telegramUser.username })
        .eq('id', user.id)
    }

    // Возвращаем данные для клиента (формат совместимый с auth store)
    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name || '',
        phone: user.phone || '',
        email: user.email || '',
        telegram: telegramUser.username ? `@${telegramUser.username}` : '',
        telegramId: telegramUser.id.toString(),
        vkId: '',
        avatar: telegramUser.photo_url || user.avatar || null,
        birthDate: null,
        nickname: user.nickname || null,
        role: 'user'
      },
      account: {
        contractNumber: account.contract_number,
        balance: account.balance,
        status: account.status,
        tariff: tariffName,
        address: account.address_full || '',
        startDate: account.start_date
      }
    }
  } catch (e: any) {
    // Если это уже createError, пробрасываем
    if (e.statusCode) {
      throw e
    }

    // Ошибки валидации
    console.error('[TWA Auth] Validation error:', e.message)
    throw createError({
      statusCode: 401,
      message: e.message || 'Ошибка валидации данных Telegram'
    })
  }
})
