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
    class="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-lg"
    :class="[
      paddingClasses[padding],
      hover && 'transition-all duration-300 hover:bg-white/[0.06] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5'
    ]"
  >
    <slot />
  </div>
</template>
