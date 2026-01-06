<template>
  <div class="min-h-screen flex flex-col" style="background-color: var(--bg-base);">
    <!-- Header -->
    <LkHeader />

    <!-- Content -->
    <main class="flex-1 pt-16 pb-20 md:pb-0">
      <div class="container mx-auto px-4 py-6">
        <slot />
      </div>
    </main>

    <!-- Mobile Navigation -->
    <LkMobileNav class="md:hidden" />
  </div>
</template>
