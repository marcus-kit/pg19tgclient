<script setup lang="ts">
// Редирект на сайт Артель МИК (бизнес-услуги)
definePageMeta({
  middleware: async () => {
    await navigateTo('https://artelmik.ru', { external: true, redirectCode: 301 })
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-[var(--text-muted)]">Перенаправление...</p>
  </div>
</template>
