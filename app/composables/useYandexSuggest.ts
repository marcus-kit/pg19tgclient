import { VueYandexMaps, initYmaps } from 'vue-yandex-maps'

export interface AddressSuggestion {
  title: string
  subtitle: string
  description: string
  coordinates: [number, number] // [lat, lon]
  components: {
    city?: string
    street?: string
    house?: string
    region?: string
  }
}

export function useYandexSuggest() {
  const suggestions = ref<AddressSuggestion[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let initPromise: Promise<void> | null = null

  /**
   * Убедиться что Yandex Maps API загружен
   */
  const ensureYmapsLoaded = async (): Promise<boolean> => {
    // Уже загружен
    if (VueYandexMaps.isLoaded.value) {
      return true
    }

    // Уже загружается
    if (initPromise) {
      await initPromise
      return VueYandexMaps.isLoaded.value
    }

    // Инициируем загрузку
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
   * Получить подсказки адресов через ymaps3.search (клиентский API)
   * @param query Текст запроса
   */
  const getSuggestions = async (query: string) => {
    // Очистка предыдущего debounce таймера
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Если запрос слишком короткий - очищаем подсказки
    if (!query || query.trim().length < 3) {
      suggestions.value = []
      return
    }

    // Debounce 300ms
    return new Promise<void>((resolve) => {
      debounceTimer = setTimeout(async () => {
        isLoading.value = true
        error.value = null

        try {
          // Убеждаемся что API загружен (инициируем загрузку если нужно)
          const isLoaded = await ensureYmapsLoaded()
          if (!isLoaded) {
            console.warn('Yandex Maps API failed to load')
            suggestions.value = []
            resolve()
            return
          }

          const ymaps = VueYandexMaps.ymaps()

          // Используем ymaps3.search для поиска
          const searchResult = await ymaps.search({
            text: query.trim(),
            // Ограничиваем поиск Ростовской областью
            bounds: [[38.0, 46.5], [44.0, 50.5]] as any,
          })

          // Преобразуем результаты в наш формат
          suggestions.value = (searchResult || [])
            .slice(0, 10)
            .map((item: any) => {
              // Получаем координаты [lon, lat] из geometry
              const coords = item.geometry?.coordinates || [0, 0]
              const [lon, lat] = coords

              // Парсим компоненты адреса из properties
              const properties = item.properties || {}
              const components: AddressSuggestion['components'] = {}

              // Яндекс возвращает разные форматы, пробуем извлечь данные
              if (properties.description) {
                // description обычно содержит город/регион
                const desc = properties.description
                if (desc.includes('Ростов-на-Дону')) {
                  components.city = 'Ростов-на-Дону'
                } else if (desc.includes('Ростовская область')) {
                  components.region = 'Ростовская область'
                }
              }

              // name обычно содержит улицу/дом
              if (properties.name) {
                const nameParts = properties.name.split(',').map((s: string) => s.trim())
                if (nameParts.length >= 2) {
                  components.street = nameParts[0]
                  components.house = nameParts[1]
                } else {
                  components.street = properties.name
                }
              }

              return {
                title: properties.name || '',
                subtitle: properties.description || '',
                description: properties.descriptionOld || `${properties.name}, ${properties.description}`,
                coordinates: [lat, lon] as [number, number], // Конвертируем в [lat, lon]
                components
              }
            })

          resolve()
        } catch (e: any) {
          console.error('Yandex Search error:', e)
          error.value = e.message || 'Ошибка при загрузке подсказок'
          suggestions.value = []
          resolve()
        } finally {
          isLoading.value = false
        }
      }, 300)
    })
  }

  /**
   * Очистить список подсказок
   */
  const clearSuggestions = () => {
    suggestions.value = []
    error.value = null
  }

  return {
    suggestions: readonly(suggestions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    getSuggestions,
    clearSuggestions
  }
}
