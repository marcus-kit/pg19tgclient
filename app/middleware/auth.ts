import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check on server - localStorage not available
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // Hydrate from localStorage
  authStore.hydrate()

  // Public routes that don't require auth
  const publicRoutes = ['/lk/login', '/lk']

  // Check auth for /lk/* routes
  if (to.path.startsWith('/lk')) {
    // Redirect to login if not authenticated
    if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
      return navigateTo('/lk/login')
    }

    // Redirect to dashboard if already authenticated and trying to access login
    if (authStore.isAuthenticated && to.path === '/lk/login') {
      return navigateTo('/lk/dashboard')
    }
  }
})
