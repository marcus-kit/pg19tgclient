// Прокси для подсказок адресов через Yandex Geocoder API
// (Suggest API требует отдельный ключ, используем Geocoder как альтернативу)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const text = query.text as string
  if (!text || text.trim().length < 3) {
    return { results: [] }
  }

  try {
    // Используем Geocoder API для поиска адресов
    const params = new URLSearchParams({
      apikey: config.public.yandexMapsApiKey,
      geocode: text.trim(),
      format: 'json',
      results: '10',
      lang: 'ru_RU',
      // Ограничиваем поиск Ростовской областью
      bbox: '38.0,46.5~44.0,50.5',
      rspn: '1' // Строгое ограничение по bbox
    })

    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error(`Yandex Geocoder API error: ${response.status}`)
    }

    const data = await response.json()

    // Преобразуем ответ Geocoder в формат Suggest API
    const featureMembers = data.response?.GeoObjectCollection?.featureMember || []

    const results = featureMembers.map((item: any) => {
      const geoObject = item.GeoObject
      const metaData = geoObject.metaDataProperty?.GeocoderMetaData
      const address = metaData?.Address

      // Извлекаем компоненты адреса
      const components = address?.Components || []

      return {
        title: {
          text: geoObject.name || ''
        },
        subtitle: {
          text: geoObject.description || ''
        },
        tags: [metaData?.kind || 'address'],
        address: {
          formatted_address: address?.formatted || geoObject.name,
          component: components.map((c: any) => ({
            name: c.name,
            kind: [c.kind]
          }))
        },
        uri: `ymapsbm1://geo?ll=${geoObject.Point?.pos?.replace(' ', ',')}`
      }
    })

    return { results }
  } catch (error: any) {
    console.error('Yandex Geocoder proxy error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch suggestions'
    })
  }
})
