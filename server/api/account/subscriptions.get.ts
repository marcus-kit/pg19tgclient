// GET /api/account/subscriptions
// Возвращает подписки (подключенные услуги) пользователя

import type { Subscription, SubscriptionStatus, Service } from '~/types/service'

interface SubscriptionRow {
  id: string
  account_id: string
  service_id: string
  status: SubscriptionStatus
  started_at: string
  expires_at: string | null
  custom_price: number | null
  is_primary: boolean
  date_created: string
  date_updated: string
  service: {
    id: string
    name: string
    slug: string | null
    description: string | null
    price_monthly: number
    price_connection: number | null
    icon: string | null
    color: string | null
    features: any | null
    equipment: any | null
    sort_order: number
    is_active: boolean
  }
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Получаем пользователя из сессии
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Получаем подписки с информацией об услугах
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      service:services!subscriptions_service_id_fkey(*)
    `)
    .eq('account_id', sessionUser.accountId)
    .in('status', ['active', 'paused'])
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('Error fetching subscriptions:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки подписок' })
  }

  // Маппинг в camelCase
  const subscriptions: Subscription[] = (data as SubscriptionRow[]).map(row => {
    const svc = row.service
    return {
      id: row.id,
      accountId: row.account_id,
      serviceId: row.service_id,
      status: row.status,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      customPrice: row.custom_price,
      isPrimary: row.is_primary,
      createdAt: row.date_created,
      updatedAt: row.date_updated,
      service: svc ? {
        id: svc.id,
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        priceMonthly: svc.price_monthly,
        priceConnection: svc.price_connection,
        icon: svc.icon,
        color: svc.color,
        features: svc.features,
        equipment: svc.equipment,
        sortOrder: svc.sort_order,
        isActive: svc.is_active
      } : undefined
    }
  })

  return { subscriptions }
})
