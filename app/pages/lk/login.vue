<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useTelegramLogin, type TelegramUser } from '~/composables/useTelegramLogin'

definePageMeta({
  layout: 'guest'
})

const authStore = useAuthStore()
const router = useRouter()
const { initWidget, loginWithTelegram, isLoading: telegramLoading, error: telegramError, cleanup } = useTelegramLogin()

// Метод авторизации: 'telegram' | 'contract'
const authMethod = ref<'telegram' | 'contract'>('telegram')

// Форма для авторизации по договору
const form = reactive({
  contractNumber: '',
  lastName: '',
  firstName: ''
})

const isLoading = ref(false)
const error = ref('')

// Переключение метода
const setAuthMethod = (method: 'telegram' | 'contract') => {
  authMethod.value = method
  error.value = ''
}

// Инициализация Telegram виджета
onMounted(() => {
  nextTick(() => {
    if (authMethod.value === 'telegram') {
      initWidget('telegram-login-container', handleTelegramAuth)
    }
  })
})

// При переключении на Telegram - инициализируем виджет
watch(authMethod, (method) => {
  if (method === 'telegram') {
    nextTick(() => {
      initWidget('telegram-login-container', handleTelegramAuth)
    })
  }
})

onUnmounted(() => {
  cleanup()
})

// Обработка авторизации через Telegram
const handleTelegramAuth = async (telegramUser: TelegramUser) => {
  error.value = ''

  try {
    const response = await loginWithTelegram(telegramUser)

    // Сохраняем данные в store
    authStore.setAuthData(response.user, response.account)

    // Переходим в ЛК
    router.push('/lk/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Ошибка авторизации через Telegram'
  }
}

// Обработка авторизации по договору
const handleContractSubmit = async () => {
  error.value = ''

  if (!form.contractNumber || !form.lastName || !form.firstName) {
    error.value = 'Заполните все поля'
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      user: any
      account: any
    }>('/api/auth/contract', {
      method: 'POST',
      body: {
        contractNumber: form.contractNumber,
        lastName: form.lastName,
        firstName: form.firstName
      }
    })

    // Сохраняем данные в store
    authStore.setAuthData(response.user, response.account)

    // Переходим в ЛК
    router.push('/lk/dashboard')
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Ошибка авторизации'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <UCard padding="lg">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">Вход в личный кабинет</h1>
        <p class="text-[var(--text-muted)]">Выберите способ входа</p>
      </div>

      <!-- Tabs -->
      <div class="flex mb-6 p-1 rounded-lg" style="background: var(--glass-bg);">
        <button
          @click="setAuthMethod('telegram')"
          class="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
          :class="authMethod === 'telegram'
            ? 'bg-[#0088cc] text-white shadow-md'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        >
          <Icon name="simple-icons:telegram" class="w-5 h-5" />
          Telegram
        </button>
        <button
          @click="setAuthMethod('contract')"
          class="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
          :class="authMethod === 'contract'
            ? 'bg-primary text-white shadow-md'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        >
          <Icon name="heroicons:document-text" class="w-5 h-5" />
          По договору
        </button>
      </div>

      <!-- Telegram Login -->
      <div v-if="authMethod === 'telegram'" class="space-y-4">
        <p class="text-sm text-[var(--text-muted)] text-center">
          Нажмите кнопку ниже для входа через Telegram
        </p>

        <!-- Telegram Widget Container -->
        <div id="telegram-login-container" class="flex justify-center min-h-[48px]">
          <div v-if="telegramLoading" class="flex items-center gap-2 text-[var(--text-muted)]">
            <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            Авторизация...
          </div>
        </div>

        <!-- Info -->
        <div class="p-3 rounded-lg text-sm" style="background: var(--glass-bg);">
          <p class="text-[var(--text-muted)]">
            <Icon name="heroicons:information-circle" class="w-4 h-4 inline mr-1" />
            Если ваш Telegram не привязан к аккаунту, войдите по номеру договора и привяжите его в профиле.
          </p>
        </div>
      </div>

      <!-- Contract Login Form -->
      <form v-else @submit.prevent="handleContractSubmit" class="space-y-5">
        <UInput
          v-model="form.contractNumber"
          type="text"
          label="Номер договора"
          placeholder="12345"
          inputmode="numeric"
        />

        <UInput
          v-model="form.lastName"
          type="text"
          label="Фамилия"
          placeholder="Иванов"
        />

        <UInput
          v-model="form.firstName"
          type="text"
          label="Имя"
          placeholder="Иван"
        />

        <!-- Submit -->
        <UButton type="submit" variant="primary" block :loading="isLoading">
          Войти
        </UButton>
      </form>

      <!-- Error -->
      <p v-if="error || telegramError" class="mt-4 text-sm text-red-400 text-center">
        {{ error || telegramError }}
      </p>

      <!-- Footer -->
      <div class="mt-6 pt-6 text-center" style="border-top: 1px solid var(--glass-border);">
        <NuxtLink to="/" class="text-sm text-[var(--text-muted)] hover:text-primary transition-colors">
          Вернуться на главную
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
