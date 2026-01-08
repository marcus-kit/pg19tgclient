interface NotificationSettings {
  email?: boolean
  telegram?: boolean
  sms?: boolean
  push?: boolean
  news?: boolean
  promo?: boolean
}

interface UpdateBody {
  settings: NotificationSettings
}

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию - userId берём из сессии
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const body = await readBody<UpdateBody>(event)

  if (!body.settings || typeof body.settings !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'settings обязателен'
    })
  }

  const supabase = useSupabaseServer()

  // Получаем текущие настройки
  const { data: current } = await supabase
    .from('users')
    .select('notifications_settings')
    .eq('id', userId)
    .single()

  // Мержим с новыми
  const merged = {
    ...(current?.notifications_settings || {}),
    ...body.settings
  }

  const { error } = await supabase
    .from('users')
    .update({ notifications_settings: merged })
    .eq('id', userId)

  if (error) {
    console.error('Error updating notifications:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при сохранении настроек'
    })
  }

  return { success: true, settings: merged }
})
