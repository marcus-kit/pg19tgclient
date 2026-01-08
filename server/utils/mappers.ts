/**
 * Мапперы для преобразования данных из БД (snake_case) в API формат (camelCase)
 */

// ============================================
// User & Account
// ============================================

export interface DBUser {
  id: string
  first_name: string
  last_name: string
  middle_name?: string
  phone: string
  email: string
  telegram?: string
  telegram_id?: string | null
  vk_id?: string
  avatar?: string | null
  birth_date?: string | null
  role?: 'user' | 'admin' | 'moderator'
  created_at?: string
}

export interface APIUser {
  id: string
  firstName: string
  lastName: string
  middleName: string
  phone: string
  email: string
  telegram: string
  telegramId: string | null
  vkId: string
  avatar: string | null
  birthDate: string | null
  role?: 'user' | 'admin' | 'moderator'
}

export const mapUserFromDB = (row: DBUser): APIUser => ({
  id: row.id,
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  middleName: row.middle_name || '',
  phone: row.phone || '',
  email: row.email || '',
  telegram: row.telegram || '',
  telegramId: row.telegram_id || null,
  vkId: row.vk_id || '',
  avatar: row.avatar || null,
  birthDate: row.birth_date || null,
  role: row.role || 'user'
})

export interface DBAccount {
  id: string
  user_id: string
  contract_number: number
  balance: number
  status: 'active' | 'blocked'
  tariff_id?: string
  tariff?: string
  address: string
  start_date: string
  created_at?: string
}

export interface APIAccount {
  id: string
  contractNumber: number
  balance: number
  status: 'active' | 'blocked'
  tariff: string
  address: string
  startDate: string
}

export const mapAccountFromDB = (row: DBAccount): APIAccount => ({
  id: row.id,
  contractNumber: row.contract_number,
  balance: row.balance || 0,
  status: row.status || 'active',
  tariff: row.tariff || '',
  address: row.address || '',
  startDate: row.start_date || ''
})

// ============================================
// News
// ============================================

export interface DBNews {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  cover_image?: string
  category?: string
  tags?: string[]
  is_published: boolean
  published_at?: string
  views_count: number
  author_id?: string
  created_at: string
  updated_at: string
}

export interface APINews {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string | null
  category: string
  tags: string[]
  isPublished: boolean
  publishedAt: string | null
  viewsCount: number
  authorId: string | null
  createdAt: string
  updatedAt: string
}

export const mapNewsFromDB = (row: DBNews): APINews => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt || '',
  content: row.content,
  coverImage: row.cover_image || null,
  category: row.category || '',
  tags: row.tags || [],
  isPublished: row.is_published,
  publishedAt: row.published_at || null,
  viewsCount: row.views_count || 0,
  authorId: row.author_id || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// ============================================
// Sessions
// ============================================

export interface DBSession {
  id: string
  user_id: string
  device: string
  browser: string
  os: string
  ip_address: string
  location?: string
  last_active: string
  is_current: boolean
  created_at: string
}

export interface APISession {
  id: string
  device: string
  browser: string
  os: string
  ip: string
  location: string
  lastActive: string
  current: boolean
}

export const mapSessionFromDB = (row: DBSession): APISession => ({
  id: row.id,
  device: row.device || '',
  browser: row.browser || '',
  os: row.os || '',
  ip: row.ip_address || '',
  location: row.location || '',
  lastActive: row.last_active,
  current: row.is_current || false
})

// ============================================
// Achievements
// ============================================

export interface DBAchievement {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  icon: string
  progress: number
  max_progress: number
  unlocked: boolean
  unlocked_at?: string | null
  created_at: string
}

export interface APIAchievement {
  id: string
  type: string
  title: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt: string | null
}

export const mapAchievementFromDB = (row: DBAchievement): APIAchievement => ({
  id: row.id,
  type: row.type,
  title: row.title,
  description: row.description,
  icon: row.icon || '',
  progress: row.progress || 0,
  maxProgress: row.max_progress || 100,
  unlocked: row.unlocked || false,
  unlockedAt: row.unlocked_at || null
})

// ============================================
// Connection Requests
// ============================================

export interface DBConnectionRequest {
  id: string
  name: string
  phone: string
  address: string
  latitude?: number
  longitude?: number
  tariff_id?: string
  comment?: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  source?: string
  created_at: string
}

export interface APIConnectionRequest {
  id: string
  name: string
  phone: string
  address: string
  latitude: number | null
  longitude: number | null
  tariffId: string | null
  comment: string
  status: string
  source: string
  createdAt: string
}

export const mapConnectionRequestFromDB = (row: DBConnectionRequest): APIConnectionRequest => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  address: row.address,
  latitude: row.latitude || null,
  longitude: row.longitude || null,
  tariffId: row.tariff_id || null,
  comment: row.comment || '',
  status: row.status,
  source: row.source || 'website',
  createdAt: row.created_at
})

// ============================================
// Services & Tariffs
// ============================================

export interface DBService {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  price?: number
  features?: Record<string, unknown>
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface APIService {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  price: number
  features: Record<string, unknown>
  isActive: boolean
  sortOrder: number
}

export const mapServiceFromDB = (row: DBService): APIService => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  icon: row.icon || '',
  price: row.price || 0,
  features: row.features || {},
  isActive: row.is_active,
  sortOrder: row.sort_order || 0
})
