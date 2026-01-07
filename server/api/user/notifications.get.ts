import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

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

  // Дефолтные настройки
  const defaults = {
    email: true,
    telegram: true,
    sms: false,
    push: true,
    news: true,
    promo: false
  }

  return {
    ...defaults,
    ...(data?.notifications_settings || {})
  }
})
