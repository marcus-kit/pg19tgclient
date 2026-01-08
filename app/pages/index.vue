<script setup lang="ts">
/**
 * Index page - редирект на dashboard
 */
definePageMeta({
  layout: false
})

// Редирект на dashboard
navigateTo('/dashboard', { replace: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      <p class="text-[var(--text-muted)] mt-4">Загрузка...</p>
    </div>
  </div>
</template>
