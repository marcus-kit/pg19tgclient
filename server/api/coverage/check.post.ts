import { createClient } from '@supabase/supabase-js'

interface RequestBody {
  latitude: number
  longitude: number
}

interface CoverageResult {
  in_coverage: boolean
  zone_id: string | null
  zone_name: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<RequestBody>(event)

  // Валидация входных данных
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'Invalid coordinates. Both latitude and longitude must be numbers.'
    })
  }

  // Валидация диапазона координат
  if (body.latitude < -90 || body.latitude > 90) {
    throw createError({
      statusCode: 400,
      message: 'Latitude must be between -90 and 90'
    })
  }

  if (body.longitude < -180 || body.longitude > 180) {
    throw createError({
      statusCode: 400,
      message: 'Longitude must be between -180 and 180'
    })
  }

  // Подключение к Supabase с service role
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  try {
    // Вызов PostGIS функции проверки
    const { data, error } = await supabase
      .rpc('check_point_in_coverage', {
        lat: body.latitude,
        lon: body.longitude
      })

    if (error) {
      throw error
    }

    // Функция возвращает массив с одной строкой (или пустой)
    const result = data?.[0] as CoverageResult | undefined

    if (!result) {
      // Если данные не получены
      return {
        inCoverage: false,
        zoneId: null,
        zoneName: null,
        message: 'Не удалось проверить адрес'
      }
    }

    return {
      inCoverage: result.in_coverage,
      zoneId: result.zone_id,
      zoneName: result.zone_name,
      message: result.in_coverage
        ? 'Адрес в зоне покрытия'
        : 'Адрес вне зоны покрытия. Вы можете оставить заявку, мы свяжемся с вами.'
    }
  } catch (error: any) {
    console.error('Coverage check error:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to check coverage'
    })
  }
})
