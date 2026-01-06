<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'guest'
})

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  contractNumber: '',
  lastName: '',
  firstName: ''
})

const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  if (!form.contractNumber || !form.lastName || !form.firstName) {
    error.value = 'Заполните все поля'
    return
  }

  isLoading.value = true

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800))

  // Mock login
  authStore.login(form.contractNumber, `${form.lastName} ${form.firstName}`)

  isLoading.value = false
  router.push('/lk/dashboard')
}
</script>

<template>
  <div class="w-full max-w-md">
    <UCard padding="lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">Вход в личный кабинет</h1>
        <p class="text-[var(--text-muted)]">Введите данные вашего договора</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <UInput
          v-model="form.contractNumber"
          type="text"
          label="Номер договора"
          placeholder="12345"
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

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-400 text-center">{{ error }}</p>

        <!-- Submit -->
        <UButton type="submit" variant="primary" block :loading="isLoading">
          Войти
        </UButton>
      </form>

      <!-- Footer -->
      <div class="mt-6 pt-6 text-center" style="border-top: 1px solid var(--glass-border);">
        <NuxtLink to="/" class="text-sm text-[var(--text-muted)] hover:text-primary transition-colors">
          Вернуться на главную
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
