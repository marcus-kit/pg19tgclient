export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server side
  if (import.meta.server) return

  const authStore = useAuthStore()
  const { initDataRaw, isReady } = useTwa()

  // If already authenticated, skip
  if (authStore.isAuthenticated) return

  // Wait a bit for Telegram WebApp to initialize
  if (!isReady.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // If we have initData, try to authenticate
  if (initDataRaw.value) {
    authStore.setLoading(true)

    try {
      const response = await $fetch('/api/auth/twa', {
        method: 'POST',
        body: { initDataRaw: initDataRaw.value }
      })

      if (response.user) {
        authStore.setUser(response.user)
      }
    }
    catch (error) {
      console.error('Auth error:', error)
    }
    finally {
      authStore.setLoading(false)
    }
  }
})
