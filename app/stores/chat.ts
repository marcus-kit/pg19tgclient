import { defineStore } from 'pinia'

interface ChatState {
  isOpen: boolean
  isMinimized: boolean
  unreadCount: number
  sessionId: string | null
  guestName: string | null
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    isOpen: false,
    isMinimized: false,
    unreadCount: 0,
    sessionId: null,
    guestName: null
  }),

  actions: {
    open() {
      this.isOpen = true
      this.isMinimized = false
    },

    close() {
      this.isOpen = false
      this.isMinimized = false
    },

    minimize() {
      this.isMinimized = true
    },

    restore() {
      this.isMinimized = false
    },

    toggle() {
      if (this.isMinimized) {
        this.restore()
      } else if (this.isOpen) {
        this.minimize()
      } else {
        this.open()
      }
    },

    setSessionId(id: string) {
      this.sessionId = id
    },

    setGuestName(name: string) {
      this.guestName = name
    },

    incrementUnread() {
      this.unreadCount++
    },

    clearUnread() {
      this.unreadCount = 0
    }
  },

  persist: {
    pick: ['sessionId', 'guestName']
  }
})
