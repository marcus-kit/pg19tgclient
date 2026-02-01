import { defineStore } from 'pinia'

interface User {
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
  nickname?: string | null
  role?: 'user' | 'admin' | 'moderator'
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  telegram: boolean
  types: {
    payments: boolean
    maintenance: boolean
    promotions: boolean
    news: boolean
  }
}

interface LoginSession {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  lastActive: string
  current: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string | null
  progress?: number
  maxProgress?: number
}

interface Referral {
  id: string
  name: string
  registeredAt: string
  bonus: number
}

interface ReferralProgram {
  code: string
  totalInvited: number
  totalBonus: number
  referrals: Referral[]
}

type CustomerType = 'individual' | 'company'

interface Account {
  contractNumber: number
  balance: number
  status: 'active' | 'blocked'
  tariff: string
  address: string
  startDate: string
  customerType?: CustomerType
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  account: Account | null
  notifications: NotificationSettings
  sessions: LoginSession[]
  achievements: Achievement[]
  referralProgram: ReferralProgram | null
}

const STORAGE_KEY = 'pg19_lk_auth'

const defaultNotifications: NotificationSettings = {
  email: false,
  sms: false,
  push: false,
  telegram: false,
  types: {
    payments: true,
    maintenance: true,
    promotions: false,
    news: false,
  },
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    account: null,
    notifications: {
      email: false,
      sms: false,
      push: false,
      telegram: false,
      types: {
        payments: true,
        maintenance: true,
        promotions: false,
        news: false,
      },
    },
    sessions: [],
    achievements: [],
    referralProgram: null,
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
      const avgDailyCost = 1700
      return Math.max(0, Math.floor((state.account.balance || 0) / avgDailyCost))
    },

    isAdmin: (state): boolean => {
      return state.user?.role === 'admin'
    },

    isModerator: (state): boolean => {
      return state.user?.role === 'moderator'
    },

    hasAdminAccess: (state): boolean => {
      return state.user?.role === 'admin' || state.user?.role === 'moderator'
    },
  },

  actions: {
    async setAuthData(user: Partial<User>, account: Partial<Account>) {
      this.isAuthenticated = true
      this.user = {
        id: user.id || '',
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
        nickname: user.nickname || null,
        role: user.role || 'user',
      }
      this.account = {
        contractNumber: account.contractNumber || 0,
        balance: account.balance || 0,
        status: account.status || 'active',
        tariff: account.tariff || '',
        address: account.address || '',
        startDate: account.startDate || '',
        customerType: account.customerType,
      }
      this.persist()

      await Promise.allSettled([
        this.loadNotifications(),
        this.loadAchievements(),
        this.loadSessions(),
        this.loadReferralProgram(),
      ])
    },

    async loadNotifications() {
      if (!this.user?.id) return
      try {
        const data = await $fetch<Record<string, boolean>>('/api/user/notifications')
        this.notifications = {
          email: data.email ?? true,
          sms: data.sms ?? false,
          push: data.push ?? true,
          telegram: data.telegram ?? true,
          types: {
            payments: data.payments ?? true,
            maintenance: data.maintenance ?? true,
            promotions: data.promo ?? false,
            news: data.news ?? true,
          },
        }
        this.persist()
      }
      catch (error) {
        console.error('Failed to load notifications:', error)
        this.notifications = { ...defaultNotifications }
      }
    },

    async loadAchievements() {
      if (!this.user?.id) return
      try {
        const data = await $fetch<Achievement[]>('/api/user/achievements', {
          query: { userId: this.user.id },
        })
        this.achievements = data
        this.persist()
      }
      catch (error) {
        console.error('Failed to load achievements:', error)
        this.achievements = []
      }
    },

    async loadSessions() {
      if (!this.user?.id) return
      try {
        const data = await $fetch<LoginSession[]>('/api/user/sessions', {
          query: { userId: this.user.id },
        })
        this.sessions = data
        this.persist()
      }
      catch (error) {
        console.error('Failed to load sessions:', error)
        this.sessions = []
      }
    },

    async loadReferralProgram() {
      if (!this.user?.id) return
      try {
        const data = await $fetch<ReferralProgram>('/api/user/referral', {
          query: { userId: this.user.id },
        })
        this.referralProgram = data
        this.persist()
      }
      catch (error) {
        console.error('Failed to load referral program:', error)
        this.referralProgram = null
      }
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
      this.account = null
      this.notifications = {
        email: false,
        sms: false,
        push: false,
        telegram: false,
        types: {
          payments: true,
          maintenance: true,
          promotions: false,
          news: false,
        },
      }
      this.sessions = []
      this.achievements = []
      this.referralProgram = null
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    async updateNotifications(settings: Partial<NotificationSettings>) {
      if (settings.types) {
        this.notifications = {
          ...this.notifications,
          ...settings,
          types: { ...this.notifications.types, ...settings.types },
        }
      }
      else {
        this.notifications = { ...this.notifications, ...settings }
      }
      this.persist()

      if (this.user?.id) {
        try {
          const apiSettings: Record<string, boolean> = {}
          if (settings.email !== undefined) apiSettings.email = settings.email
          if (settings.sms !== undefined) apiSettings.sms = settings.sms
          if (settings.push !== undefined) apiSettings.push = settings.push
          if (settings.telegram !== undefined) apiSettings.telegram = settings.telegram
          if (settings.types?.payments !== undefined) apiSettings.payments = settings.types.payments
          if (settings.types?.maintenance !== undefined) apiSettings.maintenance = settings.types.maintenance
          if (settings.types?.promotions !== undefined) apiSettings.promo = settings.types.promotions
          if (settings.types?.news !== undefined) apiSettings.news = settings.types.news

          await $fetch('/api/user/notifications', {
            method: 'PUT',
            body: { settings: apiSettings },
          })
        }
        catch (error) {
          console.error('Failed to sync notification settings:', error)
        }
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

    async updateUserData(data: Partial<User>): Promise<boolean> {
      if (!this.user?.id) return false

      try {
        const response = await $fetch<{ success: boolean, user: User }>('/api/user/update', {
          method: 'POST',
          body: {
            userId: this.user.id,
            data,
          },
        })

        if (response.success && response.user) {
          this.user = {
            ...this.user,
            ...response.user,
          }
          this.persist()
          return true
        }
        return false
      }
      catch (error) {
        console.error('Failed to update user data:', error)
        return false
      }
    },

    terminateSession(sessionId: string) {
      this.sessions = this.sessions.filter(s => s.id !== sessionId)
      this.persist()
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
          referralProgram: this.referralProgram,
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

            if (this.isAuthenticated && this.user?.id) {
              this.loadNotifications()
              this.loadAchievements()
              this.loadSessions()
              this.loadReferralProgram()
            }
          }
          catch {
            this.logout()
          }
        }
      }
    },
  },
})
