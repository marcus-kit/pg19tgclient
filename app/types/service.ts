export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type ServiceType = 'connection' | 'profile' | 'equipment'
export type BillingType = 'nrc' | 'mrc' | 'nrc_mrc'

export interface Service {
  id: number
  name: string
  slug: string | null
  description: string | null
  priceMonthly: number
  priceConnection: number | null
  icon: string | null
  color: string | null
  features: ServiceFeature[] | null
  equipment: ServiceEquipment[] | null
  sortOrder: number
  isActive: boolean
  serviceType?: ServiceType | null
  billingType?: BillingType | null
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
  cancelled: 'Отменена',
}

export const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'neutral',
}

export const serviceTypeLabels: Record<ServiceType, string> = {
  connection: 'Подключение',
  profile: 'Тариф',
  equipment: 'Оборудование',
}

export const serviceTypeIcons: Record<ServiceType, string> = {
  connection: 'heroicons:plug',
  profile: 'heroicons:signal',
  equipment: 'heroicons:tv',
}

export const billingTypeLabels: Record<BillingType, string> = {
  nrc: 'Разовый',
  mrc: 'Ежемесячный',
  nrc_mrc: 'Разовый + Ежемесячный',
}
