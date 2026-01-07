<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import IMask from 'imask'

interface Props {
  modelValue?: string
  label?: string
  error?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validation': [isValid: boolean]
}>()

const inputElement = ref<HTMLInputElement | null>(null)
let masked: any = null

// Валидация: телефон должен быть 11 цифр (79991234567)
const isValid = computed(() => {
  const digits = props.modelValue.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('7')
})

// Инициализация IMask
onMounted(() => {
  if (!inputElement.value) return

  const maskOptions = {
    mask: '+{7} (000) 000-00-00',
    lazy: false, // Показывать маску всегда
    placeholderChar: '_'
  }

  masked = IMask(inputElement.value, maskOptions)

  // При изменении значения маски
  masked.on('accept', () => {
    // Получаем только цифры (unmasked value)
    const unmaskedValue = masked.unmaskedValue
    emit('update:modelValue', unmaskedValue)
  })

  // Устанавливаем начальное значение если есть
  if (props.modelValue) {
    masked.unmaskedValue = props.modelValue
  }
})

// Очистка при размонтировании
onBeforeUnmount(() => {
  if (masked) {
    masked.destroy()
  }
})

// Следим за изменениями извне (например, сброс формы)
watch(() => props.modelValue, (newValue) => {
  if (masked && masked.unmaskedValue !== newValue) {
    masked.unmaskedValue = newValue || ''
  }
})

// Эмитим валидацию при изменении
watch(isValid, (valid) => {
  emit('validation', valid)
}, { immediate: true })
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {{ label }} <span v-if="required" class="text-primary">*</span>
    </label>

    <input
      ref="inputElement"
      type="tel"
      :required="required"
      class="w-full px-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      :class="{
        'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
        'border-[var(--glass-border)]': !error
      }"
      :style="{
        background: 'var(--glass-bg)',
        border: error ? '1px solid rgb(239 68 68)' : '1px solid var(--glass-border)'
      }"
      placeholder="+7 (___) ___-__-__"
    />

    <p v-if="error" class="mt-1.5 text-sm text-red-400">{{ error }}</p>

    <p v-else-if="modelValue && !isValid" class="mt-1.5 text-sm text-red-400">
      Введите корректный номер телефона
    </p>
  </div>
</template>
