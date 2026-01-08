<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md'
})

const classes = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full'

  const variants = {
    success: 'bg-accent/20 text-accent',
    warning: 'bg-primary/20 text-primary',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-info/20 text-blue-400',
    neutral: 'bg-white/10 text-gray-300'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return [base, variants[props.variant], sizes[props.size]]
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
