import type { News, NewsDetail } from '~/types/news'

export const useNews = () => {
  /**
   * Получить список новостей
   * @param limit - количество новостей (по умолчанию 3)
   * @param category - фильтр по категории
   * @param active - только активные (не истёкшие)
   */
  const fetchNews = async (options: {
    limit?: number
    category?: string
    active?: boolean
  } = {}) => {
    const { limit = 3, category, active = true } = options

    const query: Record<string, string> = {}
    if (category) query.category = category
    if (active) query.active = 'true'

    const { data, error, pending, refresh } = await useFetch<{ news: News[] }>(
      '/api/news',
      {
        query,
        key: `news-list-${JSON.stringify(query)}`,
        transform: (response) => {
          // Ограничение на клиенте (API возвращает все)
          return {
            news: response.news.slice(0, limit)
          }
        }
      }
    )

    return {
      news: computed(() => data.value?.news || []),
      error,
      pending,
      refresh
    }
  }

  /**
   * Получить полную новость с вложениями
   */
  const fetchNewsById = async (id: string) => {
    const { data, error, pending } = await useFetch<{ news: NewsDetail }>(
      `/api/news/${id}`,
      {
        key: `news-detail-${id}`
      }
    )

    return {
      news: computed(() => data.value?.news || null),
      error,
      pending
    }
  }

  return {
    fetchNews,
    fetchNewsById
  }
}
