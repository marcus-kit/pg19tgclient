import { VueYandexMaps, initYmaps } from 'vue-yandex-maps'

export interface GeocoderResult {
  address: string
  coordinates: [number, number] // [lat, lon]
  components: {
    city?: string
    street?: string
    house?: string
    region?: string
    country?: string
  }
  precision: string // 'exact' | 'street' | 'other'
}

export function useYandexGeocoder() {
  const result = ref<GeocoderResult | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let initPromise: Promise<void> | null = null

  /**
   * Убедиться что Yandex Maps API загружен
   */
  const ensureYmapsLoaded = async (): Promise<boolean> => {
    if (VueYandexMaps.isLoaded.value) {
      return true
    }

    if (initPromise) {
      await initPromise
      return VueYandexMaps.isLoaded.value
    }

    try {
      initPromise = initYmaps()
      await initPromise
      return VueYandexMaps.isLoaded.value
    } catch (e) {
      console.error('Failed to init Yandex Maps:', e)
      return false
    }
  }

  /**
   * Прямое геокодирование: адрес → координаты (клиентский API)
   * @param address Текстовый адрес
   * @returns Результат геокодирования с координатами
   */
  const geocodeAddress = async (address: string): Promise<GeocoderResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Убеждаемся что API загружен
      const loaded = await ensureYmapsLoaded()
      if (!loaded) {
        throw new Error('Yandex Maps API not loaded')
      }

      const ymaps = VueYandexMaps.ymaps()

      // Используем ymaps3.search для геокодирования
      const searchResult = await ymaps.search({
        text: address,
        bounds: [[38.0, 46.5], [44.0, 50.5]] as any, // Ростовская область
      })

      if (!searchResult || searchResult.length === 0) {
        throw new Error('Адрес не найден')
      }

      const firstResult = searchResult[0]
      const coords = firstResult.geometry?.coordinates || [0, 0]
      const [lon, lat] = coords
      const properties = firstResult.properties || {}

      // Парсим компоненты адреса
      const components: GeocoderResult['components'] = {}

      if (properties.description) {
        const desc = properties.description
        if (desc.includes('Ростов-на-Дону')) {
          components.city = 'Ростов-на-Дону'
        }
        if (desc.includes('Ростовская область')) {
          components.region = 'Ростовская область'
        }
        if (desc.includes('Россия')) {
          components.country = 'Россия'
        }
      }

      if (properties.name) {
        const nameParts = properties.name.split(',').map((s: string) => s.trim())
        if (nameParts.length >= 2) {
          components.street = nameParts[0]
          components.house = nameParts[1]
        } else {
          components.street = properties.name
        }
      }

      const geocodeResult: GeocoderResult = {
        address: `${properties.name || ''}, ${properties.description || ''}`.replace(/^, |, $/g, ''),
        coordinates: [lat, lon],
        components,
        precision: 'exact' // ymaps3.search не возвращает precision
      }

      result.value = geocodeResult
      return geocodeResult
    } catch (e: any) {
      console.error('Geocoder error:', e)
      error.value = e.message || 'Ошибка при геокодировании адреса'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обратное геокодирование: координаты → адрес (клиентский API)
   * @param lat Широта
   * @param lon Долгота
   * @returns Результат с адресом
   */
  const reverseGeocode = async (lat: number, lon: number): Promise<GeocoderResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Убеждаемся что API загружен
      const loaded = await ensureYmapsLoaded()
      if (!loaded) {
        throw new Error('Yandex Maps API not loaded')
      }

      const ymaps = VueYandexMaps.ymaps()

      // Используем ymaps3.search с координатами для обратного геокодирования
      // Формат: "lon,lat"
      const searchResult = await ymaps.search({
        text: `${lon},${lat}`,
      })

      if (!searchResult || searchResult.length === 0) {
        throw new Error('Адрес не найден для указанных координат')
      }

      const firstResult = searchResult[0]
      const returnedCoords = firstResult.geometry?.coordinates || [lon, lat]
      const [returnedLon, returnedLat] = returnedCoords
      const properties = firstResult.properties || {}

      // Парсим компоненты адреса
      const components: GeocoderResult['components'] = {}

      if (properties.description) {
        const desc = properties.description
        if (desc.includes('Ростов-на-Дону')) {
          components.city = 'Ростов-на-Дону'
        }
        if (desc.includes('Ростовская область')) {
          components.region = 'Ростовская область'
        }
        if (desc.includes('Россия')) {
          components.country = 'Россия'
        }
      }

      if (properties.name) {
        const nameParts = properties.name.split(',').map((s: string) => s.trim())
        if (nameParts.length >= 2) {
          components.street = nameParts[0]
          components.house = nameParts[1]
        } else {
          components.street = properties.name
        }
      }

      const geocodeResult: GeocoderResult = {
        address: `${properties.name || ''}, ${properties.description || ''}`.replace(/^, |, $/g, ''),
        coordinates: [returnedLat, returnedLon],
        components,
        precision: 'exact'
      }

      result.value = geocodeResult
      return geocodeResult
    } catch (e: any) {
      console.error('Reverse geocoder error:', e)
      error.value = e.message || 'Ошибка при обратном геокодировании'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    result: readonly(result),
    isLoading: readonly(isLoading),
    error: readonly(error),
    geocodeAddress,
    reverseGeocode
  }
}
