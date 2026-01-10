import type { Ticket, TicketDetail, TicketComment, TicketStatus, TicketCategory } from '~/types/ticket'

export const useTickets = () => {
  /**
   * Получить список тикетов
   */
  const fetchTickets = async (options: {
    status?: TicketStatus
  } = {}) => {
    const { status } = options

    const query: Record<string, string> = {}
    if (status) query.status = status

    const { data, error, pending, refresh } = await useFetch<{ tickets: Ticket[] }>(
      '/api/support/tickets',
      {
        query,
        key: `tickets-${JSON.stringify(query)}`
      }
    )

    return {
      tickets: computed(() => data.value?.tickets || []),
      error,
      pending,
      refresh
    }
  }

  /**
   * Получить тикет с комментариями
   */
  const fetchTicket = async (id: string) => {
    const { data, error, pending, refresh } = await useFetch<{ ticket: TicketDetail }>(
      `/api/support/tickets/${id}`,
      {
        key: `ticket-${id}`
      }
    )

    return {
      ticket: computed(() => data.value?.ticket || null),
      error,
      pending,
      refresh
    }
  }

  /**
   * Создать новый тикет
   */
  const createTicket = async (payload: {
    subject: string
    description: string
    category: TicketCategory
  }) => {
    const { data, error } = await useFetch<{ ticket: Ticket }>(
      '/api/support/tickets',
      {
        method: 'POST',
        body: payload
      }
    )

    return {
      ticket: data.value?.ticket || null,
      error: error.value
    }
  }

  /**
   * Добавить комментарий к тикету
   */
  const addComment = async (ticketId: string, content: string) => {
    const { data, error } = await useFetch<{ comment: TicketComment }>(
      `/api/support/tickets/${ticketId}/comment`,
      {
        method: 'POST',
        body: { content }
      }
    )

    return {
      comment: data.value?.comment || null,
      error: error.value
    }
  }

  /**
   * Закрыть тикет (resolved или closed)
   */
  const closeTicket = async (ticketId: string, status: 'resolved' | 'closed') => {
    const { data, error } = await useFetch<{ success: boolean; status: string }>(
      `/api/support/tickets/${ticketId}/close`,
      {
        method: 'POST',
        body: { status }
      }
    )

    return {
      success: data.value?.success || false,
      error: error.value
    }
  }

  return {
    fetchTickets,
    fetchTicket,
    createTicket,
    addComment,
    closeTicket
  }
}
