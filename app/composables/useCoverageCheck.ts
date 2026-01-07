export interface CoverageResult {
  inCoverage: boolean
  zoneId: number | null
  zoneName: string | null
  message: string
}

export function useCoverageCheck() {
  const result = ref<CoverageResult | null>(null)
  const isChecking = ref(false)
  const error = ref<string | null>(null)

  /**
   * Проверить вхождение точки в зону покрытия
   * @param lat Широта
   * @param lon Долгота
   * @returns Результат проверки
   */
  const checkCoverage = async (lat: number, lon: number): Promise<CoverageResult> => {
    isChecking.value = true
    error.value = null

    try {
      const response = await $fetch<CoverageResult>('/api/coverage/check', {
        method: 'POST',
        body: {
          latitude: lat,
          longitude: lon
        }
      })

      result.value = response
      return response
    } catch (e: any) {
      console.error('Coverage check error:', e)
      error.value = e.data?.message || e.message || 'Ошибка при проверке зоны покрытия'

      // Fallback результат при ошибке
      const fallbackResult: CoverageResult = {
        inCoverage: false,
        zoneId: null,
        zoneName: null,
        message: error.value
      }

      result.value = fallbackResult
      return fallbackResult
    } finally {
      isChecking.value = false
    }
  }

  /**
   * Очистить результат проверки
   */
  const clearResult = () => {
    result.value = null
    error.value = null
  }

  return {
    result: readonly(result),
    isChecking: readonly(isChecking),
    error: readonly(error),
    checkCoverage,
    clearResult
  }
}
