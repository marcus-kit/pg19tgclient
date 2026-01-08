import { createClient } from '@supabase/supabase-js'

interface AddressData {
  text: string
  components?: Record<string, any>
  latitude: number
  longitude: number
}

interface RequestBody {
  fullName: string
  phone: string
  address: AddressData
  source?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<RequestBody>(event)

  // =====================================
  // 1. ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
  // =====================================

  // Проверка обязательных полей
  if (!body.fullName || !body.phone || !body.address) {
    throw createError({
      statusCode: 400,
      message: 'Не заполнены обязательные поля: ФИО, телефон, адрес'
    })
  }

  // Валидация имени
  const fullName = body.fullName.trim()
  if (fullName.length < 2) {
    throw createError({
      statusCode: 400,
      message: 'Имя должно содержать минимум 2 символа'
    })
  }

  // Валидация телефона (только цифры, 11 символов, начинается с 7)
  const phone = body.phone.replace(/\D/g, '') // Убираем все нецифровые символы
  if (phone.length !== 11 || !phone.startsWith('7')) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный формат телефона. Ожидается +7XXXXXXXXXX'
    })
  }

  // Валидация координат
  const { latitude, longitude } = body.address
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw createError({
      statusCode: 400,
      message: 'Некорректные координаты адреса'
    })
  }

  // Валидация текста адреса
  const addressText = body.address.text.trim()
  if (!addressText) {
    throw createError({
      statusCode: 400,
      message: 'Не указан адрес'
    })
  }

  // =====================================
  // 2. ПОДКЛЮЧЕНИЕ К SUPABASE
  // =====================================

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  try {
    // =====================================
    // 3. ПРОВЕРКА ЗОНЫ ПОКРЫТИЯ
    // =====================================

    const { data: coverageData, error: coverageError } = await supabase
      .rpc('check_point_in_coverage', {
        lat: latitude,
        lon: longitude
      })

    if (coverageError) {
      console.error('Coverage check error:', coverageError)
      throw createError({
        statusCode: 500,
        message: 'Ошибка при проверке зоны покрытия'
      })
    }

    const coverageResult = coverageData?.[0] || { in_coverage: false, zone_id: null, zone_name: null }

    // =====================================
    // 4. СОЗДАНИЕ ЗАЯВКИ
    // =====================================

    const { data: request, error: insertError } = await supabase
      .from('connection_requests')
      .insert({
        // Поля для совместимости со старой схемой
        contact_name: fullName,
        contact_method: 'phone',
        contact_value: `+${phone}`,
        address_raw: addressText,
        // Новые поля
        full_name: fullName,
        phone: `+${phone}`, // Сохраняем с +
        address_text: addressText,
        address_components: body.address.components || null,
        latitude,
        longitude,
        in_coverage_zone: coverageResult.in_coverage,
        coverage_zone_id: coverageResult.zone_id,
        status: 'new',
        source: body.source || 'website',
        metadata: {
          user_agent: getHeader(event, 'user-agent'),
          referer: getHeader(event, 'referer'),
          ip: getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip'),
          created_from: 'website_form'
        }
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw createError({
        statusCode: 500,
        message: 'Ошибка при создании заявки'
      })
    }

    // =====================================
    // 5. ВОЗВРАТ РЕЗУЛЬТАТА
    // =====================================

    return {
      success: true,
      requestId: request.id,
      inCoverage: coverageResult.in_coverage,
      zoneName: coverageResult.zone_name,
      message: coverageResult.in_coverage
        ? 'Заявка успешно создана. Мы свяжемся с вами в ближайшее время.'
        : 'Заявка создана. К сожалению, адрес находится вне зоны покрытия, но мы обязательно рассмотрим возможность подключения и свяжемся с вами.'
    }
  } catch (error: any) {
    // Если это уже createError - пробрасываем дальше
    if (error.statusCode) {
      throw error
    }

    console.error('Unexpected error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Произошла ошибка при обработке заявки'
    })
  }
})
