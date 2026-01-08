/**
 * Composable для работы с подсказками адресов DaData
 * Заменяет useYandexSuggest более точной нормализацией адресов
 */

export interface DadataSuggestion {
  value: string              // Полный адрес
  unrestricted_value: string // Адрес без ограничений
  title: string              // Короткое название (улица, дом)
  subtitle: string           // Город/район
  coordinates: [number, number] | null // [lat, lon]
  // Компоненты
  region?: string
  city?: string
  street?: string
  house?: string
  flat?: string
  postal_code?: string
  fias_id?: string
  fias_level?: string
}

export function useDadataSuggest() {
  const suggestions = ref<DadataSuggestion[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Очистка таймера при уничтожении scope
  onScopeDispose(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })

  /**
   * Получить подсказки адресов
   * @param query Текст запроса
   * @param debounceMs Задержка debounce (по умолчанию 300мс)
   */
  const getSuggestions = async (query: string, debounceMs: number = 300) => {
    // Очистка предыдущего debounce таймера
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Если запрос слишком короткий - очищаем подсказки
    if (!query || query.trim().length < 2) {
      suggestions.value = []
      return
    }

    // Debounce
    return new Promise<void>((resolve) => {
      debounceTimer = setTimeout(async () => {
        isLoading.value = true
        error.value = null

        try {
          const response = await $fetch<{ suggestions: DadataSuggestion[] }>('/api/address/suggest', {
            method: 'POST',
            body: {
              query: query.trim(),
              count: 10
            }
          })

          suggestions.value = response.suggestions || []
          resolve()
        } catch (e: any) {
          console.error('DaData suggest error:', e)
          error.value = e.data?.message || e.message || 'Ошибка при загрузке подсказок'
          suggestions.value = []
          resolve()
        } finally {
          isLoading.value = false
        }
      }, debounceMs)
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
