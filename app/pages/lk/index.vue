<script setup lang="ts">
// Redirect to dashboard
definePageMeta({
  middleware: 'auth'
})

navigateTo('/lk/dashboard')
</script>

<template>
  <div />
</template>
