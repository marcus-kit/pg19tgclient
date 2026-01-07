import { createClient } from '@supabase/supabase-js'

interface NotificationSettings {
  email?: boolean
  telegram?: boolean
  sms?: boolean
  push?: boolean
  news?: boolean
  promo?: boolean
}

interface UpdateBody {
  userId: number
  settings: NotificationSettings
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<UpdateBody>(event)

  if (!body.userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  if (!body.settings || typeof body.settings !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'settings обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Получаем текущие настройки
  const { data: current } = await supabase
    .from('users')
    .select('notifications_settings')
    .eq('id', body.userId)
    .single()

  // Мержим с новыми
  const merged = {
    ...(current?.notifications_settings || {}),
    ...body.settings
  }

  const { error } = await supabase
    .from('users')
    .update({ notifications_settings: merged })
    .eq('id', body.userId)

  if (error) {
    console.error('Error updating notifications:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при сохранении настроек'
    })
  }

  return { success: true, settings: merged }
})
