/**
 * GET /api/geolocation/ip
 * Определение местоположения пользователя по IP-адресу
 * Используется как fallback когда браузер не даёт доступ к геолокации
 */
export default defineEventHandler(async (event) => {
  // Получаем IP пользователя
  const headers = getHeaders(event)
  const forwardedFor = headers['x-forwarded-for']
  const realIp = headers['x-real-ip']
  const cfConnectingIp = headers['cf-connecting-ip']

  // Приоритет: Cloudflare → X-Forwarded-For → X-Real-IP → connection IP
  let ip = cfConnectingIp
    || (forwardedFor ? forwardedFor.split(',')[0].trim() : null)
    || realIp
    || getRequestIP(event)

  // Если IP локальный (разработка), используем fallback для Ростова
  const isLocalIp = !ip || ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.') || ip?.startsWith('10.')

  if (isLocalIp) {
    // Fallback для локальной разработки — центр Ростова-на-Дону
    return {
      success: true,
      source: 'fallback',
      coordinates: [47.2357, 39.7015] as [number, number], // [lat, lon]
      city: 'Ростов-на-Дону',
      region: 'Ростовская область',
      country: 'Россия',
      accuracy: 'city'
    }
  }

  try {
    // Используем ip-api.com (бесплатно, без ключа)
    const response = await $fetch<any>(`http://ip-api.com/json/${ip}`, {
      query: {
        fields: 'status,message,country,regionName,city,lat,lon,query',
        lang: 'ru'
      }
    })

    if (response.status !== 'success') {
      throw new Error(response.message || 'IP geolocation failed')
    }

    return {
      success: true,
      source: 'ip',
      coordinates: [response.lat, response.lon] as [number, number], // [lat, lon]
      city: response.city,
      region: response.regionName,
      country: response.country,
      ip: response.query,
      accuracy: 'city' // IP geolocation обычно точен до города
    }
  } catch (error: any) {
    console.error('IP geolocation error:', error)

    // Fallback на Ростов-на-Дону если не удалось определить
    return {
      success: true,
      source: 'fallback',
      coordinates: [47.2357, 39.7015] as [number, number],
      city: 'Ростов-на-Дону',
      region: 'Ростовская область',
      country: 'Россия',
      accuracy: 'city'
    }
  }
})
