import type { Invoice, InvoiceStatus } from '~/types/invoice'

export const useInvoices = () => {
  /**
   * Получить список счетов
   */
  const fetchInvoices = async (options: {
    status?: InvoiceStatus
    limit?: number
  } = {}) => {
    const { status, limit = 50 } = options

    const query: Record<string, string | number> = { limit }
    if (status) query.status = status

    const { data, error, pending, refresh } = await useFetch<{ invoices: Invoice[] }>(
      '/api/invoices',
      {
        query,
        key: `invoices-${JSON.stringify(query)}`
      }
    )

    return {
      invoices: computed(() => data.value?.invoices || []),
      error,
      pending,
      refresh
    }
  }

  /**
   * Получить неоплаченные счета (для dashboard)
   */
  const fetchUnpaidInvoices = async () => {
    const { data, error, pending, refresh } = await useFetch<{ invoices: Invoice[] }>(
      '/api/invoices/unpaid',
      {
        key: 'invoices-unpaid'
      }
    )

    return {
      invoices: computed(() => data.value?.invoices || []),
      error,
      pending,
      refresh
    }
  }

  return {
    fetchInvoices,
    fetchUnpaidInvoices
  }
}
