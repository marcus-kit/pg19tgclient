import { validate, parse } from '@tma.js/init-data-node'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { initDataRaw } = await readBody(event)

  if (!initDataRaw) {
    throw createError({
      statusCode: 400,
      message: 'Missing initDataRaw'
    })
  }

  if (!config.telegramBotToken) {
    throw createError({
      statusCode: 500,
      message: 'Telegram bot token not configured'
    })
  }

  try {
    // Validate initData signature
    validate(initDataRaw, config.telegramBotToken, {
      expiresIn: 3600 // 1 hour
    })

    // Parse initData
    const initData = parse(initDataRaw)

    if (!initData.user) {
      throw createError({
        statusCode: 400,
        message: 'No user data in initData'
      })
    }

    const telegramUser = initData.user
    const supabase = useSupabaseServer()

    // Find user by telegram_id
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, account_id, first_name, last_name, telegram_username, telegram_photo, telegram_premium')
      .eq('telegram_id', telegramUser.id)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding user:', findError)
      throw createError({
        statusCode: 500,
        message: 'Database error'
      })
    }

    let user: {
      id: string
      account_id: string
      first_name: string
      last_name: string | null
      username: string | null
      photo_url: string | null
      is_premium: boolean
    }

    if (existingUser) {
      // Update user info from Telegram
      await supabase
        .from('users')
        .update({
          first_name: telegramUser.firstName,
          last_name: telegramUser.lastName || null,
          telegram_username: telegramUser.username || null,
          telegram_photo: telegramUser.photoUrl || null,
          telegram_premium: telegramUser.isPremium || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      user = {
        id: existingUser.id,
        account_id: existingUser.account_id,
        first_name: telegramUser.firstName,
        last_name: telegramUser.lastName || null,
        username: telegramUser.username || null,
        photo_url: telegramUser.photoUrl || null,
        is_premium: telegramUser.isPremium || false
      }

      // Create session
      await createUserSession(
        event,
        existingUser.id,
        existingUser.account_id,
        'telegram',
        String(telegramUser.id),
        { telegram_user: telegramUser }
      )
    }
    else {
      // User not found - return minimal data without creating session
      // In production, you might want to create a new user or redirect to registration
      user = {
        id: String(telegramUser.id),
        account_id: '',
        first_name: telegramUser.firstName,
        last_name: telegramUser.lastName || null,
        username: telegramUser.username || null,
        photo_url: telegramUser.photoUrl || null,
        is_premium: telegramUser.isPremium || false
      }
    }

    return { user }
  }
  catch (error: any) {
    console.error('TWA auth error:', error)
    throw createError({
      statusCode: 401,
      message: error.message || 'Invalid initData'
    })
  }
})
