<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useTelegramLogin, type TelegramUser } from '~/composables/useTelegramLogin'

const authStore = useAuthStore()
const { initWidget, linkTelegram, isLoading, error, cleanup } = useTelegramLogin()

const isLinked = computed(() => !!authStore.user?.telegramId)
const telegramUsername = computed(() => authStore.user?.telegram || '')

const linkSuccess = ref(false)

onMounted(() => {
  if (!isLinked.value) {
    nextTick(() => {
      initWidget('telegram-link-container', handleTelegramLink)
    })
  }
})

onUnmounted(() => {
  cleanup()
})

const handleTelegramLink = async (telegramUser: TelegramUser) => {
  if (!authStore.user?.id) return

  try {
    const response = await linkTelegram(authStore.user.id, telegramUser)

    // Обновляем данные в store
    authStore.updateTelegram(
      response.telegramId.toString(),
      response.telegramUsername
    )

    linkSuccess.value = true
  } catch (e) {
    // Ошибка уже в error ref
  }
}
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">Telegram</h2>
      <UBadge v-if="isLinked" variant="success" size="sm">
        <Icon name="heroicons:check" class="w-3 h-3 mr-1" />
        Привязан
      </UBadge>
    </div>

    <!-- Telegram привязан -->
    <div v-if="isLinked" class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-[#0088cc]/10">
        <Icon name="simple-icons:telegram" class="w-8 h-8 text-[#0088cc]" />
      </div>
      <div>
        <p class="text-[var(--text-primary)] font-medium">{{ telegramUsername || 'Привязан' }}</p>
        <p class="text-sm text-[var(--text-muted)]">
          Вы можете входить в личный кабинет через Telegram
        </p>
      </div>
    </div>

    <!-- Telegram не привязан -->
    <div v-else class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">
        Привяжите Telegram для быстрого входа в личный кабинет
      </p>

      <!-- Telegram Widget Container -->
      <div id="telegram-link-container" class="flex justify-center min-h-[48px]">
        <div v-if="isLoading" class="flex items-center gap-2 text-[var(--text-muted)]">
          <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
          Привязка...
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="linkSuccess" class="p-3 rounded-lg bg-accent/10 text-accent text-sm flex items-center gap-2">
        <Icon name="heroicons:check-circle" class="w-5 h-5" />
        Telegram успешно привязан!
      </div>

      <!-- Error Message -->
      <div v-if="error" class="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
        <Icon name="heroicons:exclamation-circle" class="w-5 h-5" />
        {{ error }}
      </div>

      <!-- Benefits -->
      <div class="p-4 rounded-lg space-y-2" style="background: var(--glass-bg);">
        <p class="text-sm font-medium text-[var(--text-primary)]">Преимущества:</p>
        <ul class="text-sm text-[var(--text-muted)] space-y-1">
          <li class="flex items-center gap-2">
            <Icon name="heroicons:bolt" class="w-4 h-4 text-primary" />
            Мгновенный вход без пароля
          </li>
          <li class="flex items-center gap-2">
            <Icon name="heroicons:bell" class="w-4 h-4 text-primary" />
            Уведомления в Telegram
          </li>
          <li class="flex items-center gap-2">
            <Icon name="heroicons:shield-check" class="w-4 h-4 text-primary" />
            Двухфакторная защита
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>
