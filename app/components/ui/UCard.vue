<script setup lang="ts">
interface Props {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  padding: 'md'
})

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}
</script>

<template>
  <div
    class="glass-card rounded-2xl"
    :class="[
      paddingClasses[padding],
      hover && 'cursor-pointer'
    ]"
  >
    <slot />
  </div>
</template>
