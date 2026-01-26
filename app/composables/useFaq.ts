import type { FaqItem } from '~/types/faq'

export const useFaq = () => {
  /**
   * Получить FAQ
   */
  const fetchFaq = () => {
    const { data, error, pending, refresh } = useFetch<{ faq: FaqItem[] }>(
      '/api/faq',
      {
        key: 'faq-list',
        lazy: true
      }
    )

    return {
      faq: computed(() => data.value?.faq || []),
      error,
      pending,
      refresh
    }
  }

  return {
    fetchFaq
  }
}
