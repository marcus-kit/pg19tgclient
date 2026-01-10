<script setup lang="ts">
/**
 * Кнопка переключения fullscreen режима
 * Показывается только на поддерживаемых платформах (Bot API 8.0+)
 */
const {
  isFullscreen,
  supportsFullscreen,
  toggleFullscreen,
  hapticSelection
} = useTelegramWebApp()

const isLoading = ref(false)

const handleToggle = async () => {
  if (isLoading.value) return

  hapticSelection()
  isLoading.value = true

  try {
    await toggleFullscreen()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button
    v-if="supportsFullscreen"
    @click="handleToggle"
    :disabled="isLoading"
    class="flex items-center gap-3 w-full p-4 rounded-xl transition-colors active:opacity-80"
    :style="{
      backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))'
    }"
  >
    <div
      class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
      :style="{
        backgroundColor: isFullscreen
          ? 'rgba(52, 199, 89, 0.2)'
          : 'rgba(var(--tg-button-color-rgb, 247, 148, 29), 0.2)'
      }"
    >
      <Icon
        :name="isFullscreen ? 'heroicons:arrows-pointing-in' : 'heroicons:arrows-pointing-out'"
        class="w-5 h-5 transition-colors"
        :style="{
          color: isFullscreen
            ? '#34C759'
            : 'var(--tg-button-color, var(--primary))'
        }"
      />
    </div>
    <div class="flex-1 text-left">
      <p class="font-medium text-[var(--tg-text-color,#fff)]">
        Полноэкранный режим
      </p>
      <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)]">
        {{ isFullscreen ? 'Включён' : 'Скрывает верхнюю панель' }}
      </p>
    </div>
    <div
      class="w-12 h-7 rounded-full relative transition-colors shrink-0"
      :style="{
        backgroundColor: isFullscreen
          ? '#34C759'
          : 'var(--tg-hint-color, #8b8b8b)'
      }"
    >
      <div
        class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200"
        :class="isFullscreen ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </div>
  </button>
</template>
