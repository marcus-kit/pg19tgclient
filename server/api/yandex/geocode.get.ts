// Прокси для Яндекс Геокодер API (обход CORS)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const geocode = query.geocode as string
  if (!geocode) {
    throw createError({
      statusCode: 400,
      message: 'Missing geocode parameter'
    })
  }

  try {
    const params = new URLSearchParams({
      apikey: config.public.yandexMapsApiKey,
      geocode,
      format: 'json',
      results: '1',
      lang: 'ru_RU'
    })

    // Добавляем kind если указан (для reverse geocoding)
    if (query.kind) {
      params.append('kind', query.kind as string)
    }

    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error(`Yandex Geocoder API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Yandex Geocoder proxy error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to geocode'
    })
  }
})
