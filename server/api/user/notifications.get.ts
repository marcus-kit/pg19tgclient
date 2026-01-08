export default defineEventHandler(async (event) => {
  // Проверяем авторизацию - userId берём из сессии
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const supabase = useSupabaseServer()

  const { data, error } = await supabase
    .from('users')
    .select('notifications_settings')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching notifications:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке настроек'
    })
  }

  // Дефолтные настройки (channels + types)
  const defaults = {
    // Channels
    email: true,
    telegram: true,
    sms: false,
    push: true,
    // Types
    news: true,
    promo: false,
    payments: true,
    maintenance: true
  }

  return {
    ...defaults,
    ...(data?.notifications_settings || {})
  }
})
