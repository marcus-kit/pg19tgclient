<template>
  <div class="min-h-screen mesh-gradient-hero flex flex-col">
    <!-- Header -->
    <header class="py-6">
      <div class="container mx-auto px-4">
        <NuxtLink to="/" class="flex items-center gap-3 w-fit">
          <img src="/logo.png" alt="PG19" class="h-10" />
        </NuxtLink>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 flex items-center justify-center px-4 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="py-6 text-center text-gray-500 text-sm">
      <p>&copy; 2024 ПЖ19. Все права защищены.</p>
    </footer>
  </div>
</template>
