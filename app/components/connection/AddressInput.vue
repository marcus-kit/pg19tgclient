<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { AddressSuggestion } from '~/composables/useYandexSuggest'

interface AddressValue {
  text: string
  coordinates: [number, number] | null
  components: Record<string, any> | null
}

interface Props {
  modelValue?: AddressValue
  label?: string
  error?: string
  required?: boolean
  region?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ text: '', coordinates: null, components: null }),
  required: true,
  region: 'Ростовская область'
})

const emit = defineEmits<{
  'update:modelValue': [value: AddressValue]
  'coverage-check': [result: any]
}>()

// Ref для контейнера (click-outside)
const containerRef = ref<HTMLElement | null>(null)

// Composables
const { suggestions, isLoading, getSuggestions, clearSuggestions } = useYandexSuggest()
const { geocodeAddress } = useYandexGeocoder()
const { checkCoverage } = useCoverageCheck()

// Local state
const inputText = ref(props.modelValue.text)
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const coverageStatus = ref<'checking' | 'in_zone' | 'out_zone' | null>(null)

// Валидация: адрес должен иметь координаты
const isValid = computed(() => {
  return props.modelValue.coordinates !== null
})

// Цвет рамки в зависимости от статуса зоны
const borderColor = computed(() => {
  if (props.error) return 'rgb(239 68 68)' // red-500
  if (coverageStatus.value === 'in_zone') return 'rgb(0 166 81)' // accent green
  if (coverageStatus.value === 'out_zone') return 'rgb(239 68 68)' // red-500
  return 'var(--glass-border)'
})

// Обработка ввода текста
const handleInput = async () => {
  const query = inputText.value

  // Сбрасываем координаты при изменении текста
  emit('update:modelValue', {
    text: query,
    coordinates: null,
    components: null
  })

  coverageStatus.value = null
  selectedIndex.value = -1

  if (query.trim().length < 3) {
    clearSuggestions()
    showSuggestions.value = false
    return
  }

  // Получаем подсказки с debounce 300ms (внутри composable)
  await getSuggestions(query)

  showSuggestions.value = suggestions.value.length > 0
}

// Выбор подсказки из списка
const selectSuggestion = async (suggestion: AddressSuggestion) => {
  inputText.value = suggestion.description || suggestion.title
  showSuggestions.value = false
  clearSuggestions()

  // Геокодируем выбранный адрес для получения точных координат
  try {
    coverageStatus.value = 'checking'

    const geocodeResult = await geocodeAddress(inputText.value)

    const addressValue: AddressValue = {
      text: geocodeResult.address,
      coordinates: geocodeResult.coordinates,
      components: geocodeResult.components
    }

    emit('update:modelValue', addressValue)

    // Проверяем зону покрытия
    const [lat, lon] = geocodeResult.coordinates
    const coverage = await checkCoverage(lat, lon)

    coverageStatus.value = coverage.inCoverage ? 'in_zone' : 'out_zone'
    emit('coverage-check', coverage)
  } catch (e) {
    console.error('Geocode error:', e)
    coverageStatus.value = null
  }
}

// Навигация по клавиатуре
const handleKeydown = (e: KeyboardEvent) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      clearSuggestions()
      break
  }
}

// Закрыть выпадашку при клике вне
const handleDocumentClick = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showSuggestions.value = false
  }
}

// Добавляем/удаляем обработчик клика при монтировании
onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

// Синхронизация с внешними изменениями
watch(() => props.modelValue.text, (newText) => {
  if (inputText.value !== newText) {
    inputText.value = newText
  }
})
</script>

<template>
  <div ref="containerRef" class="w-full">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {{ label }} <span v-if="required" class="text-primary">*</span>
    </label>

    <div class="relative">
      <input
        v-model="inputText"
        type="text"
        :required="required"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="showSuggestions = suggestions.length > 0"
        class="w-full px-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        :class="{
          'pr-12': isLoading || coverageStatus === 'checking'
        }"
        :style="{
          background: 'var(--glass-bg)',
          border: `1px solid ${borderColor}`
        }"
        placeholder="Начните вводить адрес..."
        autocomplete="off"
      />

      <!-- Loading indicator -->
      <div v-if="isLoading || coverageStatus === 'checking'" class="absolute right-4 top-1/2 -translate-y-1/2">
        <Icon name="heroicons:arrow-path" class="w-5 h-5 text-primary animate-spin" />
      </div>

      <!-- Coverage status icon -->
      <div v-else-if="coverageStatus === 'in_zone'" class="absolute right-4 top-1/2 -translate-y-1/2">
        <Icon name="heroicons:check-circle" class="w-5 h-5 text-accent" />
      </div>

      <div v-else-if="coverageStatus === 'out_zone'" class="absolute right-4 top-1/2 -translate-y-1/2">
        <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-500" />
      </div>

      <!-- Suggestions dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl max-h-80 overflow-y-auto"
        style="background-color: #111827; border: 1px solid #374151; z-index: 9999;"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click.stop.prevent="selectSuggestion(suggestion)"
          type="button"
          class="w-full px-4 py-3 text-left transition-colors"
          :style="{
            backgroundColor: index === selectedIndex ? '#1f2937' : '#111827',
            borderBottom: index < suggestions.length - 1 ? '1px solid #374151' : 'none'
          }"
          @mouseenter="selectedIndex = index"
        >
          <div class="text-sm font-medium text-white">
            {{ suggestion.title }}
          </div>
          <div class="text-xs text-gray-400 mt-1">
            {{ suggestion.subtitle }}
          </div>
        </button>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-1.5 text-sm text-red-400">{{ error }}</p>

    <!-- Coverage status message -->
    <p v-else-if="coverageStatus === 'in_zone'" class="mt-1.5 text-sm text-accent flex items-center gap-1">
      <Icon name="heroicons:check-circle" class="w-4 h-4" />
      <span>Адрес в зоне покрытия</span>
    </p>

    <p v-else-if="coverageStatus === 'out_zone'" class="mt-1.5 text-sm text-red-400 flex items-center gap-1">
      <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
      <span>Адрес вне зоны покрытия</span>
    </p>

    <!-- Validation hint -->
    <p v-else-if="inputText && !isValid" class="mt-1.5 text-sm text-[var(--text-muted)]">
      Выберите адрес из списка подсказок
    </p>
  </div>
</template>
