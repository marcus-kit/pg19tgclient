// Интерфейс данных от Telegram Login Widget
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Глобальный callback для Telegram Widget
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

export function useTelegramLogin() {
  const config = useRuntimeConfig()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Инициализация виджета
  const initWidget = (containerId: string, onAuth: (user: TelegramUser) => void) => {
    // Устанавливаем глобальный callback
    window.onTelegramAuth = onAuth

    // Создаём script элемент для виджета
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`Container #${containerId} not found`)
      return
    }

    // Очищаем контейнер
    container.innerHTML = ''

    // Создаём скрипт виджета
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', config.public.telegramBotUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '8')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')

    container.appendChild(script)
  }

  // Авторизация через API
  const loginWithTelegram = async (telegramUser: TelegramUser) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        user: any
        account: any
      }>('/api/auth/telegram', {
        method: 'POST',
        body: telegramUser
      })

      return response
    } catch (e: any) {
      const message = e.data?.message || e.message || 'Ошибка авторизации'
      error.value = message
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  // Привязка Telegram к существующему аккаунту
  const linkTelegram = async (userId: number, telegramUser: TelegramUser) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        telegramId: number
        telegramUsername?: string
      }>('/api/auth/link-telegram', {
        method: 'POST',
        body: {
          userId,
          telegramId: telegramUser.id,
          telegramUsername: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: telegramUser.photo_url,
          authDate: telegramUser.auth_date,
          hash: telegramUser.hash
        }
      })

      return response
    } catch (e: any) {
      const message = e.data?.message || e.message || 'Ошибка привязки'
      error.value = message
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  // Очистка при размонтировании
  const cleanup = () => {
    if (window.onTelegramAuth) {
      delete window.onTelegramAuth
    }
  }

  return {
    isLoading,
    error,
    initWidget,
    loginWithTelegram,
    linkTelegram,
    cleanup
  }
}
