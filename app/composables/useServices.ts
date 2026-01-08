import type { Service, Subscription } from '~/types/service'

export const useServices = () => {
  /**
   * Получить список доступных услуг
   */
  const fetchServices = async () => {
    const { data, error, pending, refresh } = await useFetch<{ services: Service[] }>(
      '/api/services',
      {
        key: 'services-list'
      }
    )

    return {
      services: computed(() => data.value?.services || []),
      error,
      pending,
      refresh
    }
  }

  /**
   * Получить подписки (подключенные услуги) пользователя
   */
  const fetchSubscriptions = async () => {
    const { data, error, pending, refresh } = await useFetch<{ subscriptions: Subscription[] }>(
      '/api/account/subscriptions',
      {
        key: 'account-subscriptions'
      }
    )

    return {
      subscriptions: computed(() => data.value?.subscriptions || []),
      error,
      pending,
      refresh
    }
  }

  return {
    fetchServices,
    fetchSubscriptions
  }
}
