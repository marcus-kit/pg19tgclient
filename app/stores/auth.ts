import { defineStore } from 'pinia'

interface User {
  id: number
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  is_premium?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false
  }),

  actions: {
    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },

    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    }
  },

  persist: {
    pick: ['user', 'isAuthenticated']
  }
})
