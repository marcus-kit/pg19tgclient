import { createClient } from '@supabase/supabase-js'

interface UpdateUserData {
  userId: number
  data: {
    firstName?: string
    lastName?: string
    middleName?: string
    birthDate?: string | null
    phone?: string
    email?: string
    vkId?: string
    avatar?: string | null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<UpdateUserData>(event)

  // Проверяем наличие userId
  if (!body.userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  // Подключаемся к Supabase с service role
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Маппинг camelCase → snake_case (только заполненные поля)
  const dbData: Record<string, unknown> = {}

  if (body.data.firstName !== undefined) dbData.first_name = body.data.firstName
  if (body.data.lastName !== undefined) dbData.last_name = body.data.lastName
  if (body.data.middleName !== undefined) dbData.middle_name = body.data.middleName
  if (body.data.birthDate !== undefined) dbData.birth_date = body.data.birthDate
  if (body.data.phone !== undefined) dbData.phone = body.data.phone
  if (body.data.email !== undefined) dbData.email = body.data.email
  if (body.data.vkId !== undefined) dbData.vk_id = body.data.vkId
  if (body.data.avatar !== undefined) dbData.avatar = body.data.avatar

  // Если есть firstName или lastName - обновляем full_name
  if (body.data.firstName !== undefined || body.data.lastName !== undefined) {
    // Получаем текущие данные для формирования full_name
    const { data: currentUser } = await supabase
      .from('users')
      .select('first_name, last_name, middle_name')
      .eq('id', body.userId)
      .single()

    if (currentUser) {
      const firstName = body.data.firstName ?? currentUser.first_name
      const lastName = body.data.lastName ?? currentUser.last_name
      const middleName = body.data.middleName ?? currentUser.middle_name
      dbData.full_name = [lastName, firstName, middleName].filter(Boolean).join(' ')
    }
  }

  // Проверяем, что есть что обновлять
  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  // Обновляем пользователя
  const { data: updated, error } = await supabase
    .from('users')
    .update(dbData)
    .eq('id', body.userId)
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
      birth_date,
      avatar,
      vk_id
    `)
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении данных'
    })
  }

  // Возвращаем обновлённые данные в формате клиента
  return {
    success: true,
    user: {
      id: updated.id,
      firstName: updated.first_name,
      lastName: updated.last_name,
      middleName: updated.middle_name,
      phone: updated.phone || '',
      email: updated.email || '',
      telegram: updated.telegram_username ? `@${updated.telegram_username}` : '',
      telegramId: updated.telegram_id || null,
      vkId: updated.vk_id || '',
      avatar: updated.avatar || null,
      birthDate: updated.birth_date || null
    }
  }
})
