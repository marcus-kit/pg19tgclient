import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Пропускаем на сервере
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()
  authStore.hydrate()

  // Проверяем авторизацию
  if (!authStore.isAuthenticated) {
    return navigateTo('/lk/login')
  }

  // Проверяем права администратора
  if (!authStore.hasAdminAccess) {
    return navigateTo('/lk/dashboard')
  }
})
