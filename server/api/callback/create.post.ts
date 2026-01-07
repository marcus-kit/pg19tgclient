import { createClient } from '@supabase/supabase-js'

interface CallbackRequest {
  name: string
  phone: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CallbackRequest>(event)

  // Валидация
  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Укажите имя'
    })
  }

  if (!body.phone?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Укажите телефон'
    })
  }

  // Нормализация телефона
  const phone = body.phone.replace(/\D/g, '')
  if (phone.length < 10) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный номер телефона'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Получаем IP и User-Agent
  const headers = getHeaders(event)
  const ip = headers['x-forwarded-for']?.split(',')[0] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'

  const { error } = await supabase
    .from('callback_requests')
    .insert({
      name: body.name.trim(),
      phone: body.phone.trim(),
      ip_address: ip,
      user_agent: userAgent
    })

  if (error) {
    console.error('Error creating callback request:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании заявки'
    })
  }

  return { success: true, message: 'Заявка принята, мы перезвоним вам в ближайшее время' }
})
