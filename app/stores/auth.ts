import { defineStore } from 'pinia'

interface User {
  id: number
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

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  telegram: boolean
  news: boolean
  promo: boolean
}

interface LoginSession {
  id: number
  device: string
  browser: string
  os: string
  ip: string
  location: string
  lastActive: string
  current: boolean
}

interface Achievement {
  id: number
  type: string
  title: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt: string | null
}

interface Referral {
  id: number
  name: string
  avatar: string | null
  status: string
  bonus: number | null
  registeredAt: string
  activatedAt: string | null
}

interface ReferralProgram {
  code: string
  link: string
  inviterBonus: number
  inviteeBonus: number
  stats: {
    totalInvited: number
    totalBonus: number
  }
  invited: Referral[]
}

interface Account {
  contractNumber: number
  balance: number
  status: 'active' | 'blocked'
  tariff: string
  address: string
  startDate: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  account: Account | null
  notifications: NotificationSettings
  sessions: LoginSession[]
  achievements: Achievement[]
  referralProgram: ReferralProgram | null
  loading: {
    achievements: boolean
    sessions: boolean
    referral: boolean
    notifications: boolean
  }
}

const STORAGE_KEY = 'pg19_lk_auth'

const defaultNotifications: NotificationSettings = {
  email: true,
  telegram: true,
  sms: false,
  push: true,
  news: true,
  promo: false
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    account: null,
    notifications: { ...defaultNotifications },
    sessions: [],
    achievements: [],
    referralProgram: null,
    loading: {
      achievements: false,
      sessions: false,
      referral: false,
      notifications: false
    }
  }),

  getters: {
    fullName: (state): string => {
      if (!state.user) return ''
      return `${state.user.lastName} ${state.user.firstName} ${state.user.middleName}`.trim()
    },

    shortName: (state): string => {
      if (!state.user) return ''
      const firstInitial = state.user.firstName.charAt(0)
      const middleInitial = state.user.middleName ? state.user.middleName.charAt(0) + '.' : ''
      return `${state.user.lastName} ${firstInitial}. ${middleInitial}`.trim()
    },

    balanceRubles: (state): number => {
      return (state.account?.balance || 0) / 100
    },

    isBlocked: (state): boolean => {
      return state.account?.status === 'blocked'
    },

    daysRemaining: (state): number => {
      if (!state.account) return 0
      // Mock calculation: balance / daily_cost (assume 500 rub/month = ~17 rub/day)
      const dailyCost = 1700 // kopeks
      return Math.floor((state.account.balance || 0) / dailyCost)
    },

    isAdmin: (state): boolean => {
      return state.user?.role === 'admin'
    },

    isModerator: (state): boolean => {
      return state.user?.role === 'moderator'
    },

    hasAdminAccess: (state): boolean => {
      return state.user?.role === 'admin' || state.user?.role === 'moderator'
    }
  },

  actions: {
    // Установка данных авторизации от API
    async setAuthData(user: Partial<User>, account: Partial<Account>) {
      this.isAuthenticated = true
      this.user = {
        id: user.id || 0,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        phone: user.phone || '',
        email: user.email || '',
        telegram: user.telegram || '',
        telegramId: user.telegramId || null,
        vkId: user.vkId || '',
        avatar: user.avatar || null,
        birthDate: user.birthDate || null,
        role: user.role || 'user'
      }
      this.account = {
        contractNumber: account.contractNumber || 0,
        balance: account.balance || 0,
        status: account.status || 'active',
        tariff: account.tariff || '',
        address: account.address || '',
        startDate: account.startDate || ''
      }
      this.persist()

      // Загружаем дополнительные данные параллельно
      await Promise.allSettled([
        this.loadNotifications(),
        this.loadAchievements(),
        this.loadSessions(),
        this.loadReferralProgram()
      ])
    },

    // Загрузка настроек уведомлений
    async loadNotifications() {
      if (!this.user?.id) return
      this.loading.notifications = true
      try {
        const data = await $fetch<NotificationSettings>('/api/user/notifications', {
          query: { userId: this.user.id }
        })
        this.notifications = data
        this.persist()
      } catch (error) {
        console.error('Failed to load notifications:', error)
        this.notifications = { ...defaultNotifications }
      } finally {
        this.loading.notifications = false
      }
    },

    // Загрузка достижений
    async loadAchievements() {
      if (!this.user?.id) return
      this.loading.achievements = true
      try {
        const data = await $fetch<Achievement[]>('/api/user/achievements', {
          query: { userId: this.user.id }
        })
        this.achievements = data
        this.persist()
      } catch (error) {
        console.error('Failed to load achievements:', error)
        this.achievements = []
      } finally {
        this.loading.achievements = false
      }
    },

    // Загрузка сессий
    async loadSessions() {
      if (!this.user?.id) return
      this.loading.sessions = true
      try {
        const data = await $fetch<LoginSession[]>('/api/user/sessions', {
          query: { userId: this.user.id }
        })
        this.sessions = data
        this.persist()
      } catch (error) {
        console.error('Failed to load sessions:', error)
        this.sessions = []
      } finally {
        this.loading.sessions = false
      }
    },

    // Загрузка реферальной программы
    async loadReferralProgram() {
      if (!this.user?.id) return
      this.loading.referral = true
      try {
        const data = await $fetch<ReferralProgram>('/api/user/referral', {
          query: { userId: this.user.id }
        })
        this.referralProgram = data
        this.persist()
      } catch (error) {
        console.error('Failed to load referral program:', error)
        this.referralProgram = null
      } finally {
        this.loading.referral = false
      }
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
      this.account = null
      this.notifications = { ...defaultNotifications }
      this.sessions = []
      this.achievements = []
      this.referralProgram = null
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    async updateNotifications(settings: Partial<NotificationSettings>) {
      if (!this.user?.id) return false
      try {
        const { settings: updated } = await $fetch<{ success: boolean; settings: NotificationSettings }>(
          '/api/user/notifications',
          {
            method: 'PUT',
            body: { userId: this.user.id, settings }
          }
        )
        this.notifications = updated
        this.persist()
        return true
      } catch (error) {
        console.error('Failed to update notifications:', error)
        return false
      }
    },

    updateAvatar(avatar: string | null) {
      if (this.user) {
        this.user.avatar = avatar
        this.persist()
      }
    },

    updateTelegram(telegramId: string, telegramUsername?: string) {
      if (this.user) {
        this.user.telegramId = telegramId
        this.user.telegram = telegramUsername ? `@${telegramUsername}` : ''
        this.persist()
      }
    },

    // Обновление данных пользователя через API с сохранением в Supabase
    async updateUserData(data: Partial<User>): Promise<boolean> {
      if (!this.user?.id) return false

      try {
        const response = await $fetch<{ success: boolean; user: User }>('/api/user/update', {
          method: 'POST',
          body: {
            userId: this.user.id,
            data
          }
        })

        if (response.success && response.user) {
          // Обновляем локальный state
          this.user = {
            ...this.user,
            ...response.user
          }
          this.persist()
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to update user data:', error)
        return false
      }
    },

    async terminateSession(sessionId: number) {
      if (!this.user?.id) return false
      try {
        await $fetch(`/api/user/sessions/${sessionId}`, {
          method: 'DELETE',
          body: { userId: this.user.id }
        })
        this.sessions = this.sessions.filter(s => s.id !== sessionId)
        this.persist()
        return true
      } catch (error) {
        console.error('Failed to terminate session:', error)
        return false
      }
    },

    persist() {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isAuthenticated: this.isAuthenticated,
          user: this.user,
          account: this.account,
          notifications: this.notifications,
          sessions: this.sessions,
          achievements: this.achievements,
          referralProgram: this.referralProgram
        }))
      }
    },

    hydrate() {
      if (import.meta.client) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            this.isAuthenticated = data.isAuthenticated
            this.user = data.user
            this.account = data.account
            this.notifications = data.notifications || { ...defaultNotifications }
            this.sessions = data.sessions || []
            this.achievements = data.achievements || []
            this.referralProgram = data.referralProgram || null

            // Если авторизован — обновляем данные из API
            if (this.isAuthenticated && this.user?.id) {
              this.loadNotifications()
              this.loadAchievements()
              this.loadSessions()
              this.loadReferralProgram()
            }
          } catch {
            this.logout()
          }
        }
      }
    }
  }
})
