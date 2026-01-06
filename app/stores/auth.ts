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
  id: number
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
}

const STORAGE_KEY = 'pg19_lk_auth'

// Mock data
const mockUser: User = {
  id: 1,
  firstName: 'Иван',
  lastName: 'Петров',
  middleName: 'Сергеевич',
  phone: '+7 (999) 123-45-67',
  email: 'ivan@example.com',
  telegram: '@ivan_petrov',
  telegramId: null,
  vkId: '',
  avatar: null,
  birthDate: '1990-05-15'
}

const mockNotifications: NotificationSettings = {
  email: true,
  sms: true,
  push: false,
  telegram: true,
  types: {
    payments: true,
    maintenance: true,
    promotions: false,
    news: true
  }
}

const mockSessions: LoginSession[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    ip: '95.173.xxx.xxx',
    location: 'Москва, Россия',
    lastActive: new Date().toISOString(),
    current: true
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    ip: '95.173.xxx.xxx',
    location: 'Москва, Россия',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    current: false
  }
]

const mockAchievements: Achievement[] = [
  {
    id: 'first_payment',
    title: 'Первая оплата',
    description: 'Совершите первый платёж',
    icon: 'heroicons:credit-card',
    unlockedAt: '2023-01-20'
  },
  {
    id: 'year_with_us',
    title: 'Год вместе',
    description: 'Будьте нашим клиентом 1 год',
    icon: 'heroicons:cake',
    unlockedAt: '2024-01-15'
  },
  {
    id: 'profile_complete',
    title: 'Профиль заполнен',
    description: 'Заполните профиль на 100%',
    icon: 'heroicons:user-circle',
    unlockedAt: null,
    progress: 80,
    maxProgress: 100
  },
  {
    id: 'referral_first',
    title: 'Первый друг',
    description: 'Пригласите первого друга',
    icon: 'heroicons:user-plus',
    unlockedAt: '2023-06-10'
  },
  {
    id: 'referral_five',
    title: 'Пятеро друзей',
    description: 'Пригласите 5 друзей',
    icon: 'heroicons:users',
    unlockedAt: null,
    progress: 2,
    maxProgress: 5
  },
  {
    id: 'autopay',
    title: 'Автоплатёж',
    description: 'Подключите автоплатёж',
    icon: 'heroicons:arrow-path',
    unlockedAt: null
  }
]

const mockReferralProgram: ReferralProgram = {
  code: 'IVAN2024',
  totalInvited: 2,
  totalBonus: 600,
  referrals: [
    {
      id: 1,
      name: 'Алексей М.',
      registeredAt: '2023-06-10',
      bonus: 300
    },
    {
      id: 2,
      name: 'Мария К.',
      registeredAt: '2023-09-22',
      bonus: 300
    }
  ]
}

const mockAccount: Account = {
  contractNumber: 12345,
  balance: 150000, // kopeks = 1500 rub
  status: 'active',
  tariff: 'Интернет 500 Мбит/с',
  address: 'г. Москва, ул. Примерная, д. 1, кв. 42',
  startDate: '2023-01-15'
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
        news: false
      }
    },
    sessions: [],
    achievements: [],
    referralProgram: null
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
    setAuthData(user: Partial<User>, account: Partial<Account>) {
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
      // Пока используем mock для остальных данных
      this.notifications = mockNotifications
      this.sessions = mockSessions
      this.achievements = mockAchievements
      this.referralProgram = mockReferralProgram
      this.persist()
    },

    // Устаревший метод для совместимости
    login(contractNumber: string, fullName: string) {
      // Mock login - always succeeds
      this.isAuthenticated = true
      this.user = mockUser
      this.account = mockAccount
      this.notifications = mockNotifications
      this.sessions = mockSessions
      this.achievements = mockAchievements
      this.referralProgram = mockReferralProgram
      this.persist()
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
          news: false
        }
      }
      this.sessions = []
      this.achievements = []
      this.referralProgram = null
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    updateNotifications(settings: Partial<NotificationSettings>) {
      this.notifications = { ...this.notifications, ...settings }
      this.persist()
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
            this.notifications = data.notifications || mockNotifications
            this.sessions = data.sessions || mockSessions
            this.achievements = data.achievements || mockAchievements
            this.referralProgram = data.referralProgram || mockReferralProgram
          } catch {
            this.logout()
          }
        }
      }
    }
  }
})
