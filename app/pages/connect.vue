<script setup lang="ts">
useHead({
  title: 'Подключиться — ПЖ19'
})

// Режим ввода адреса: 'input' или 'map'
const addressMode = ref<'input' | 'map'>('input')

// Форма
const form = reactive({
  fullName: '',
  phone: '',
  address: {
    text: '',
    coordinates: null as [number, number] | null,
    components: null as Record<string, any> | null
  }
})

// Состояния
const phoneValid = ref(false)
const coverageResult = ref<any>(null)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')

// Валидация формы
const isFormValid = computed(() => {
  return (
    form.fullName.trim().length >= 2 &&
    phoneValid.value &&
    form.address.coordinates !== null
  )
})

// Обработчик проверки зоны покрытия
const onCoverageCheck = (result: any) => {
  coverageResult.value = result
}

// Отправка формы
const submitForm = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await $fetch('/api/connection/create', {
      method: 'POST',
      body: {
        fullName: form.fullName.trim(),
        phone: form.phone,
        address: form.address,
        source: 'website'
      }
    })

    // Успешная отправка
    isSubmitted.value = true
  } catch (e: any) {
    console.error('Submit error:', e)
    submitError.value = e.data?.message || e.message || 'Произошла ошибка при отправке заявки'
  } finally {
    isSubmitting.value = false
  }
}

// Сброс формы для новой заявки
const resetForm = () => {
  form.fullName = ''
  form.phone = ''
  form.address = {
    text: '',
    coordinates: null,
    components: null
  }
  phoneValid.value = false
  coverageResult.value = null
  isSubmitted.value = false
  submitError.value = ''
  addressMode.value = 'input'
}
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[500px] h-[500px] bg-primary/15 -bottom-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up">
            Подключиться к <span class="text-gradient-primary">сообществу</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] opacity-0 animate-fade-in-up stagger-1">
            Оставьте заявку, и мы свяжемся с вами для уточнения деталей
          </p>
        </div>
      </div>
    </section>

    <!-- Form -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <!-- Success message -->
          <div v-if="isSubmitted" class="text-center opacity-0 animate-fade-in-up">
            <div class="w-20 h-20 glass-card rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Icon name="heroicons:check" class="w-10 h-10 text-accent" />
            </div>
            <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">Заявка отправлена!</h2>
            <p class="text-[var(--text-muted)] mb-4">
              Мы свяжемся с вами в ближайшее время для уточнения деталей подключения.
            </p>

            <div v-if="coverageResult && !coverageResult.inCoverage" class="mb-10 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg max-w-md mx-auto">
              <p class="text-sm text-orange-400">
                <Icon name="heroicons:information-circle" class="w-4 h-4 inline mr-1" />
                Обратите внимание: адрес находится вне зоны покрытия, но мы обязательно рассмотрим возможность подключения.
              </p>
            </div>

            <div class="flex gap-4 justify-center">
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-medium transition-colors"
              >
                <Icon name="heroicons:arrow-left" class="w-4 h-4" />
                <span>Вернуться на главную</span>
              </NuxtLink>
              <button
                @click="resetForm"
                class="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                <Icon name="heroicons:arrow-path" class="w-4 h-4" />
                <span>Отправить ещё заявку</span>
              </button>
            </div>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="submitForm" class="space-y-6">
            <!-- Имя -->
            <div class="opacity-0 animate-fade-in-up">
              <UInput
                v-model="form.fullName"
                label="Как к вам обращаться?"
                type="text"
                required
                placeholder="Иван"
              />
            </div>

            <!-- Телефон -->
            <div class="opacity-0 animate-fade-in-up stagger-1">
              <ConnectionPhoneInput
                v-model="form.phone"
                label="Телефон"
                required
                @validation="phoneValid = $event"
              />
            </div>

            <!-- Переключатель режима адреса -->
            <div class="opacity-0 animate-fade-in-up stagger-2">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Адрес подключения <span class="text-primary">*</span>
              </label>
              <div class="glass-card p-2 flex gap-2">
                <button
                  @click="addressMode = 'input'"
                  type="button"
                  :class="[
                    'flex-1 px-4 py-3 rounded-lg font-medium transition-all',
                    addressMode === 'input'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : 'text-[var(--text-secondary)] hover:bg-white/5'
                  ]"
                >
                  <Icon name="heroicons:magnifying-glass" class="w-4 h-4 inline mr-2" />
                  Ввести адрес
                </button>
                <button
                  @click="addressMode = 'map'"
                  type="button"
                  :class="[
                    'flex-1 px-4 py-3 rounded-lg font-medium transition-all',
                    addressMode === 'map'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : 'text-[var(--text-secondary)] hover:bg-white/5'
                  ]"
                >
                  <Icon name="heroicons:map" class="w-4 h-4 inline mr-2" />
                  Выбрать на карте
                </button>
              </div>
            </div>

            <!-- Адрес: Input или Map -->
            <div class="opacity-0 animate-fade-in-up stagger-3 relative z-50">
              <ConnectionAddressInput
                v-if="addressMode === 'input'"
                v-model="form.address"
                label="Адрес подключения"
                required
                @coverage-check="onCoverageCheck"
              />
              <ConnectionMapPicker
                v-else
                v-model="form.address"
                :show-coverage-zone="true"
                @coverage-check="onCoverageCheck"
              />
            </div>

            <!-- Сообщение о статусе зоны покрытия -->
            <div
              v-if="coverageResult && coverageResult.inCoverage"
              class="opacity-0 animate-fade-in-up stagger-4 p-4 bg-accent/10 border border-accent/20 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-accent font-medium mb-1">Адрес в зоне покрытия!</p>
                  <p class="text-sm text-[var(--text-muted)]">
                    Отправьте заявку, и мы свяжемся с вами для уточнения деталей подключения.
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else-if="coverageResult && !coverageResult.inCoverage"
              class="opacity-0 animate-fade-in-up stagger-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-orange-500 font-medium mb-1">Адрес вне зоны покрытия</p>
                  <p class="text-sm text-[var(--text-muted)]">
                    Вы можете оставить заявку, мы обязательно рассмотрим возможность подключения и свяжемся с вами.
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit error -->
            <div
              v-if="submitError"
              class="opacity-0 animate-fade-in-up p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-red-500 font-medium mb-1">Ошибка при отправке</p>
                  <p class="text-sm text-[var(--text-muted)]">{{ submitError }}</p>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="opacity-0 animate-fade-in-up stagger-5 relative z-10">
              <button
                type="submit"
                :disabled="!isFormValid || isSubmitting"
                class="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                <span>{{ isSubmitting ? 'Отправка...' : 'Отправить заявку' }}</span>
              </button>
              <!-- Legal -->
              <p class="text-xs text-[var(--text-muted)] text-center mt-3">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Info -->
    <section class="py-20 md:py-32 mesh-gradient-dark">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-12">Как это работает</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 class="font-semibold text-[var(--text-primary)] mb-2">Заявка</h3>
              <p class="text-[var(--text-muted)] text-sm">Укажите ваш адрес и контактные данные</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 class="font-semibold text-[var(--text-primary)] mb-2">Проверка зоны</h3>
              <p class="text-[var(--text-muted)] text-sm">Мы автоматически проверим возможность подключения</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 class="font-semibold text-[var(--text-primary)] mb-2">Подключение</h3>
              <p class="text-[var(--text-muted)] text-sm">Наш специалист приедет и настроит оборудование</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
