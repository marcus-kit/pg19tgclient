<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  name: '',
  phone: ''  // Хранит только цифры (79991234567)
})

const loading = ref(false)
const success = ref(false)
const error = ref('')
const phoneValid = ref(false)

function onPhoneValidation(isValid: boolean) {
  phoneValid.value = isValid
}

async function submit() {
  error.value = ''

  if (!form.name.trim()) {
    error.value = 'Укажите имя'
    return
  }

  if (!phoneValid.value) {
    error.value = 'Укажите корректный номер телефона'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/callback/create', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        phone: form.phone
      }
    })

    success.value = true

    // Закрываем через 2 секунды
    setTimeout(() => {
      close()
    }, 2000)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err.data?.message || 'Произошла ошибка, попробуйте позже'
  } finally {
    loading.value = false
  }
}

function close() {
  isOpen.value = false
  // Сбрасываем форму
  setTimeout(() => {
    form.name = ''
    form.phone = ''
    success.value = false
    error.value = ''
  }, 300)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md glass-card rounded-3xl p-8 animate-fade-in-up">
          <!-- Close button -->
          <button
            @click="close"
            class="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
          </button>

          <!-- Success state -->
          <div v-if="success" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
              <Icon name="heroicons:check" class="w-8 h-8 text-accent" />
            </div>
            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-2">Заявка принята!</h3>
            <p class="text-[var(--text-muted)]">Мы перезвоним вам в ближайшее время</p>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="text-center mb-8">
              <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                <Icon name="heroicons:phone-arrow-up-right" class="w-7 h-7 text-primary" />
              </div>
              <h3 class="text-2xl font-bold text-[var(--text-primary)] mb-2">Обратный звонок</h3>
              <p class="text-[var(--text-muted)]">Оставьте номер и мы перезвоним</p>
            </div>

            <form @submit.prevent="submit" class="space-y-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Как к вам обращаться
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Иван"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  :disabled="loading"
                />
              </div>

              <!-- Phone -->
              <ConnectionPhoneInput
                v-model="form.phone"
                label="Телефон"
                @validation="onPhoneValidation"
              />

              <!-- Error -->
              <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

              <!-- Submit -->
              <button
                type="submit"
                class="w-full btn-primary py-3 flex items-center justify-center gap-2"
                :disabled="loading"
              >
                <Icon v-if="loading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                <span>{{ loading ? 'Отправка...' : 'Перезвоните мне' }}</span>
              </button>
            </form>

            <p class="text-xs text-[var(--text-muted)] text-center mt-4">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .glass-card,
.modal-leave-active .glass-card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .glass-card,
.modal-leave-to .glass-card {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
