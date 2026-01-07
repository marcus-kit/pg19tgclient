/**
 * Composable для загрузки управляемого контента страниц из Supabase
 * Использует таблицу site_content с page/section структурой
 */
export function useSiteContent<T extends Record<string, unknown>>(page: string) {
  const { data, pending, error, refresh } = useFetch<T>(`/api/content/page/${page}`, {
    key: `site-content-${page}`
  })

  // Хелпер для получения секции с типизацией
  const getSection = <S>(section: string): S | undefined => {
    return data.value?.[section] as S | undefined
  }

  return {
    content: data,
    pending,
    error,
    refresh,
    getSection
  }
}

/**
 * Загрузка списка услуг
 */
export function useServices() {
  return useFetch('/api/content/services', {
    key: 'services-list'
  })
}

/**
 * Загрузка категорий ТВ каналов
 */
export function useTvChannels() {
  return useFetch('/api/content/tv-channels', {
    key: 'tv-channels-list'
  })
}
