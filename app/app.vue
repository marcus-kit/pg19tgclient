<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'ru'
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage
      :keepalive="{
        max: 5,
        include: ['dashboard', 'services', 'invoices', 'community', 'more', 'support']
      }"
      :page-key="$route.fullPath"
    />
  </NuxtLayout>
</template>
