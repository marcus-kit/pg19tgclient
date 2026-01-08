<script setup lang="ts">
/**
 * Страница "Откройте в Telegram"
 * Показывается когда приложение открыто вне Telegram
 */
definePageMeta({
  layout: false
})

const config = useRuntimeConfig()
const botUsername = config.public.telegramBotUsername || 'PG19WEBAPP_bot'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
    <div class="text-center max-w-sm">
      <!-- Telegram Icon -->
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
        <Icon name="simple-icons:telegram" class="w-10 h-10 text-[#0088cc]" />
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
        Откройте в Telegram
      </h1>

      <!-- Description -->
      <p class="text-[var(--text-muted)] mb-8 leading-relaxed">
        Это приложение работает только внутри Telegram. Откройте бота и нажмите кнопку запуска приложения.
      </p>

      <!-- CTA Button -->
      <a
        :href="`https://t.me/${botUsername}`"
        target="_blank"
        class="inline-flex items-center gap-3 px-6 py-3.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors"
      >
        <Icon name="simple-icons:telegram" class="w-5 h-5" />
        Открыть @{{ botUsername }}
      </a>

      <!-- Footer -->
      <p class="text-xs text-[var(--text-muted)] mt-8">
        ПЖ19 — Личный кабинет
      </p>
    </div>
  </div>
</template>

<style scoped>
:root {
  --bg-base: #121212;
  --text-primary: #ffffff;
  --text-muted: #8b8b8b;
}
</style>
