import type { FaqItem } from '~/server/api/faq.get'

export const useFaq = () => {
  /**
   * Получить FAQ
   */
  const fetchFaq = async () => {
    const { data, error, pending, refresh } = await useFetch<{ faq: FaqItem[] }>(
      '/api/faq',
      {
        key: 'faq-list'
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
