<script setup lang="ts">
const { backButton } = useTwa()
const route = useRoute()
const router = useRouter()

// Show back button on non-root pages
watch(() => route.path, (path) => {
  if (path !== '/' && path !== '/dashboard') {
    backButton.showBackButton()
  }
  else {
    backButton.hideBackButton()
  }
}, { immediate: true })

// Handle back button click
backButton.onBackButtonClicked(() => {
  router.back()
})
</script>

<template>
  <div class="min-h-screen bg-default">
    <main class="pb-20">
      <slot />
    </main>

    <!-- Mobile Navigation -->
    <TwaMobileNav />
  </div>
</template>
