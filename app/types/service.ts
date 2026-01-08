export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface Service {
  id: number
  name: string
  slug: string | null
  description: string | null
  priceMonthly: number // в копейках
  priceConnection: number | null // в копейках
  icon: string | null
  color: string | null
  features: ServiceFeature[] | null
  equipment: ServiceEquipment[] | null
  sortOrder: number
  isActive: boolean
}

export interface ServiceFeature {
  icon: string
  title: string
  description: string
}

export interface ServiceEquipment {
  name: string
  description: string
  priceMonthly: number // в копейках
}

export interface Subscription {
  id: number
  accountId: number
  serviceId: number
  status: SubscriptionStatus
  startedAt: string
  expiresAt: string | null
  customPrice: number | null // в копейках
  isPrimary: boolean
  createdAt: string
  updatedAt: string
  // Joined data
  service?: Service
}

// Статусы для UI
export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: 'Активна',
  paused: 'Приостановлена',
  cancelled: 'Отменена'
}

export const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  active: 'green',
  paused: 'yellow',
  cancelled: 'gray'
}
