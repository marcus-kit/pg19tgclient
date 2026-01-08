<script setup lang="ts">
/**
 * TWA Layout
 * Основной layout для Telegram Web App
 * Управляет BackButton, safe areas и heartbeat
 */
const route = useRoute()
const router = useRouter()
const { showBackButton, hideBackButton, offBackButton } = useTelegramWebApp()

// Определяем, можно ли вернуться назад
const canGoBack = computed(() => {
  // На главной странице (dashboard) кнопку назад не показываем
  return route.path !== '/dashboard' && route.path !== '/'
})

// Обработчик нажатия кнопки назад
const handleBackClick = () => {
  router.back()
}

// Управление BackButton
watch(
  () => route.path,
  () => {
    if (canGoBack.value) {
      showBackButton(handleBackClick)
    } else {
      hideBackButton()
    }
  },
  { immediate: true }
)

// Очистка при размонтировании
onUnmounted(() => {
  offBackButton(handleBackClick)
  hideBackButton()
})
</script>

<template>
  <div
    class="twa-layout min-h-screen flex flex-col"
    :style="{
      backgroundColor: 'var(--tg-bg-color, var(--bg-base))',
      color: 'var(--tg-text-color, var(--text-primary))',
      paddingTop: 'var(--twa-content-safe-top, 0px)',
      paddingBottom: 'calc(64px + var(--twa-safe-bottom, 0px))'
    }"
  >
    <!-- Header -->
    <TwaHeader />

    <!-- Main Content -->
    <main class="flex-1 pt-14">
      <div class="container mx-auto px-4 py-4">
        <slot />
      </div>
    </main>

    <!-- Bottom Navigation -->
    <TwaMobileNav />
  </div>
</template>

<style>
/* Маппинг Telegram темы на CSS переменные приложения */
.twa-layout {
  --bg-base: var(--tg-bg-color, #121212);
  --bg-surface: var(--tg-secondary-bg-color, #1e1e1e);
  --text-primary: var(--tg-text-color, #ffffff);
  --text-secondary: var(--tg-text-color, #ffffff);
  --text-muted: var(--tg-hint-color, #8b8b8b);
  --primary: var(--tg-button-color, #F7941D);
  --primary-hover: var(--tg-button-color, #F7941D);
  --glass-bg: var(--tg-secondary-bg-color, rgba(255, 255, 255, 0.05));
  --glass-border: rgba(255, 255, 255, 0.1);
  --link-color: var(--tg-link-color, #007aff);
  --destructive: var(--tg-destructive-text-color, #ff3b30);
}

/* Скрываем скроллбар в WebApp */
.twa-layout::-webkit-scrollbar {
  display: none;
}

.twa-layout {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
