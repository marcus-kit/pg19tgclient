import type { Service, Subscription } from '~/types/service'

export const useServices = () => {
  /**
   * Получить список доступных услуг
   */
  const fetchServices = () => {
    const { data, error, pending, refresh } = useFetch<{ services: Service[] }>(
      '/api/services',
      {
        key: 'services-list',
        lazy: true,
      },
    )

    return {
      services: computed(() => data.value?.services || []),
      error,
      pending,
      refresh,
    }
  }

  /**
   * Получить подписки (подключенные услуги) пользователя
   */
  const fetchSubscriptions = () => {
    const { data, error, pending, refresh } = useFetch<{ subscriptions: Subscription[] }>(
      '/api/account/subscriptions',
      {
        key: 'account-subscriptions',
        lazy: true,
      },
    )

    return {
      subscriptions: computed(() => data.value?.subscriptions || []),
      error,
      pending,
      refresh,
    }
  }

  return {
    fetchServices,
    fetchSubscriptions,
  }
}
