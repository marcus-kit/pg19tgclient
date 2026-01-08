<script setup lang="ts">
/**
 * Страница "Привяжите Telegram"
 * Показывается когда Telegram не привязан к аккаунту
 */
definePageMeta({
  layout: false
})

const { closeApp } = useTelegramWebApp()

// URL клиентского портала для привязки Telegram
const clientUrl = 'https://pg19-client.doka.team/profile'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-[var(--tg-bg-color,#121212)]">
    <div class="text-center max-w-sm">
      <!-- Warning Icon -->
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Icon name="heroicons:exclamation-triangle" class="w-10 h-10 text-amber-500" />
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-[var(--tg-text-color,#ffffff)] mb-3">
        Аккаунт не привязан
      </h1>

      <!-- Description -->
      <p class="text-[var(--tg-hint-color,#8b8b8b)] mb-8 leading-relaxed">
        Ваш Telegram не привязан к аккаунту ПЖ19. Войдите в личный кабинет на сайте и привяжите Telegram в настройках профиля.
      </p>

      <!-- Instructions -->
      <div class="bg-[var(--tg-secondary-bg-color,#1e1e1e)] rounded-xl p-4 mb-6 text-left">
        <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)] mb-3">Как привязать:</p>
        <ol class="text-sm text-[var(--tg-text-color,#ffffff)] space-y-2">
          <li class="flex gap-2">
            <span class="text-[var(--tg-button-color,#007aff)]">1.</span>
            Откройте личный кабинет на сайте
          </li>
          <li class="flex gap-2">
            <span class="text-[var(--tg-button-color,#007aff)]">2.</span>
            Войдите по номеру договора
          </li>
          <li class="flex gap-2">
            <span class="text-[var(--tg-button-color,#007aff)]">3.</span>
            Перейдите в Профиль → Безопасность
          </li>
          <li class="flex gap-2">
            <span class="text-[var(--tg-button-color,#007aff)]">4.</span>
            Нажмите "Привязать Telegram"
          </li>
        </ol>
      </div>

      <!-- CTA Button -->
      <a
        :href="clientUrl"
        target="_blank"
        class="inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--tg-button-color,#007aff)] text-[var(--tg-button-text-color,#ffffff)] rounded-xl font-medium transition-opacity hover:opacity-90 w-full justify-center mb-3"
      >
        <Icon name="heroicons:arrow-top-right-on-square" class="w-5 h-5" />
        Открыть личный кабинет
      </a>

      <!-- Close button -->
      <button
        @click="closeApp"
        class="text-[var(--tg-hint-color,#8b8b8b)] text-sm hover:text-[var(--tg-text-color,#ffffff)] transition-colors"
      >
        Закрыть приложение
      </button>
    </div>
  </div>
</template>
