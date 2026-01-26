<script setup lang="ts">
definePageMeta({
  layout: 'twa'
})

// Redirect to dashboard
navigateTo('/dashboard', { replace: true })
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
  </div>
</template>
