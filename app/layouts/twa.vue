<script setup lang="ts">
/**
 * TWA Layout
 * Основной layout для Telegram Web App
 * Управляет BackButton, safe areas и heartbeat
 */
const route = useRoute()
const router = useRouter()
const { backButton } = useTwa()

// Определяем, можно ли вернуться назад
const canGoBack = computed(() => {
  return route.path !== '/dashboard' && route.path !== '/'
})

// Обработчик нажатия кнопки назад
const handleBackClick = () => {
  router.back()
}

// Безопасные методы для BackButton (vue-tg может быть не готов)
const safeBackButton = {
  show: () => {
    try {
      if (backButton?.show) backButton.show()
    } catch (e) {
      console.warn('[TWA Layout] BackButton.show() failed:', e)
    }
  },
  hide: () => {
    try {
      if (backButton?.hide) backButton.hide()
    } catch (e) {
      console.warn('[TWA Layout] BackButton.hide() failed:', e)
    }
  },
  onClick: (fn: () => void) => {
    try {
      if (backButton?.onClick) backButton.onClick(fn)
    } catch (e) {
      console.warn('[TWA Layout] BackButton.onClick() failed:', e)
    }
  },
  offClick: (fn: () => void) => {
    try {
      if (backButton?.offClick) backButton.offClick(fn)
    } catch (e) {
      console.warn('[TWA Layout] BackButton.offClick() failed:', e)
    }
  }
}

// Управление BackButton
watch(
  () => route.path,
  () => {
    if (canGoBack.value) {
      safeBackButton.show()
      safeBackButton.onClick(handleBackClick)
    } else {
      safeBackButton.hide()
    }
  },
  { immediate: true }
)

// Очистка при размонтировании
onUnmounted(() => {
  safeBackButton.offClick(handleBackClick)
  safeBackButton.hide()
})
</script>

<template>
  <div
    class="twa-layout min-h-screen flex flex-col"
    :style="{
      backgroundColor: 'var(--tg-bg-color, var(--bg-base))',
      color: 'var(--tg-text-color, var(--text-primary))',
      paddingBottom: 'calc(64px + var(--twa-safe-bottom, 0px))',
      paddingLeft: 'var(--twa-safe-left, 0px)',
      paddingRight: 'var(--twa-safe-right, 0px)'
    }"
  >
    <!-- Header -->
    <TwaHeader />

    <!-- Main Content -->
    <main
      class="flex-1"
      :style="{
        paddingTop: 'calc(56px + var(--twa-safe-top, 0px))'
      }"
    >
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
