/**
 * POST /api/address/suggest
 * Получение подсказок адресов через DaData API
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { query, count = 10 } = body

  if (!query || query.trim().length < 2) {
    return { suggestions: [] }
  }

  const config = useRuntimeConfig()
  const apiKey = config.dadataApiKey

  try {
    const response = await $fetch<any>('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: {
        query: query.trim(),
        count,
        // Ограничиваем поиск Ростовской областью
        locations: [
          { region: 'Ростовская' }
        ],
        // Добавляем координаты в ответ
        locations_boost: [
          { kladr_id: '61' } // Ростовская область
        ]
      }
    })

    // Преобразуем ответ DaData в наш формат
    const suggestions = (response.suggestions || []).map((item: any) => {
      const data = item.data || {}

      return {
        value: item.value, // Полный адрес
        unrestricted_value: item.unrestricted_value,
        // Компоненты адреса
        region: data.region_with_type,
        city: data.city_with_type || data.settlement_with_type,
        street: data.street_with_type,
        house: data.house_type && data.house ? `${data.house_type} ${data.house}` : data.house,
        flat: data.flat_type && data.flat ? `${data.flat_type} ${data.flat}` : data.flat,
        // Координаты
        coordinates: data.geo_lat && data.geo_lon
          ? [parseFloat(data.geo_lat), parseFloat(data.geo_lon)] as [number, number]
          : null,
        // Дополнительные данные
        postal_code: data.postal_code,
        fias_id: data.fias_id,
        fias_level: data.fias_level, // Уровень детализации ФИАС
        // Для отображения
        title: data.street_with_type && data.house
          ? `${data.street_with_type}, ${data.house}${data.flat ? `, кв. ${data.flat}` : ''}`
          : item.value,
        subtitle: data.city_with_type || data.settlement_with_type || data.region_with_type || ''
      }
    })

    return { suggestions }
  } catch (error: any) {
    console.error('DaData API error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении подсказок адресов'
    })
  }
})
