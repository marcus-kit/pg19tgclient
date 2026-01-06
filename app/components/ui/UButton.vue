<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'

  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 focus:ring-primary',
    secondary: 'bg-transparent border-2 border-white/20 text-white hover:border-primary hover:text-primary hover:bg-primary/10 focus:ring-primary',
    ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-white/5 focus:ring-white/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  }

  return [
    base,
    variants[props.variant],
    sizes[props.size],
    props.block && 'w-full',
    (props.disabled || props.loading) && 'opacity-50 cursor-not-allowed pointer-events-none'
  ]
})
</script>

<template>
  <button :class="classes" :disabled="disabled || loading">
    <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
