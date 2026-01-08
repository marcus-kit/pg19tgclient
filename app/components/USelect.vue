<script setup lang="ts">
interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Выберите...',
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-2 text-sm pr-9'
    case 'lg':
      return 'px-5 py-4 text-lg pr-12'
    default:
      return 'px-4 py-3 pr-10'
  }
})

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-4 h-4 right-2.5'
    case 'lg':
      return 'w-6 h-6 right-4'
    default:
      return 'w-5 h-5 right-3'
  }
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {{ label }}
    </label>
    <div class="relative">
      <select
        v-model="selectValue"
        :disabled="disabled"
        class="w-full rounded-xl text-[var(--text-primary)] bg-[var(--glass-bg)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer hover:border-[var(--text-muted)]"
        :class="[
          sizeClasses,
          { 'border-red-500 focus:border-red-500 focus:ring-red-500/20': error }
        ]"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue" class="text-[var(--text-muted)]">
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Custom dropdown arrow -->
      <div class="pointer-events-none absolute inset-y-0 flex items-center" :class="iconSizeClasses.split(' ').slice(2).join(' ')">
        <Icon
          name="heroicons:chevron-down"
          class="text-[var(--text-muted)] transition-colors"
          :class="iconSizeClasses.split(' ').slice(0, 2).join(' ')"
        />
      </div>
    </div>
    <p v-if="error" class="mt-1.5 text-sm text-red-400">{{ error }}</p>
  </div>
</template>

<style scoped>
/* Стилизация option для темной темы */
select option {
  background-color: var(--bg-surface, #1a1a2e);
  color: var(--text-primary, #fff);
  padding: 0.75rem;
}

select option:disabled {
  color: var(--text-muted, #6b7280);
}

select option:hover,
select option:focus {
  background-color: var(--glass-bg, rgba(255, 255, 255, 0.05));
}

/* Убираем стандартную стрелку в Firefox */
select {
  -moz-appearance: none;
}

/* Убираем стандартную стрелку в IE */
select::-ms-expand {
  display: none;
}
</style>
