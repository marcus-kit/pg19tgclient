<template>
  <div class="min-h-screen flex" style="background-color: var(--bg-base);">
    <!-- Sidebar -->
    <aside class="hidden md:flex w-64 flex-col glass-card border-r border-[var(--glass-border)]">
      <div class="p-6">
        <!-- Back to LK -->
        <NuxtLink
          to="/lk/dashboard"
          class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          <span>Назад в ЛК</span>
        </NuxtLink>

        <!-- Title -->
        <h2 class="text-xl font-bold text-[var(--text-primary)] mb-6">
          Админ-панель
        </h2>

        <!-- Navigation -->
        <nav class="space-y-2">
          <NuxtLink
            to="/admin"
            class="nav-item"
            active-class="nav-item-active"
            exact
          >
            <Icon name="heroicons:home" class="w-5 h-5" />
            <span>Dashboard</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/news"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:newspaper" class="w-5 h-5" />
            <span>Новости</span>
          </NuxtLink>

          <!-- Future sections (disabled for now) -->
          <div class="nav-item opacity-50 cursor-not-allowed">
            <Icon name="heroicons:users" class="w-5 h-5" />
            <span>Пользователи</span>
          </div>

          <div class="nav-item opacity-50 cursor-not-allowed">
            <Icon name="heroicons:chart-bar" class="w-5 h-5" />
            <span>Статистика</span>
          </div>
        </nav>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <slot />
      </div>
    </main>

    <!-- Mobile nav -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-[var(--glass-border)] p-4">
      <div class="flex items-center justify-around">
        <NuxtLink to="/lk/dashboard" class="flex flex-col items-center gap-1 text-[var(--text-secondary)]">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          <span class="text-xs">Назад</span>
        </NuxtLink>

        <NuxtLink to="/admin" class="flex flex-col items-center gap-1 text-[var(--text-secondary)]">
          <Icon name="heroicons:home" class="w-5 h-5" />
          <span class="text-xs">Dashboard</span>
        </NuxtLink>

        <NuxtLink to="/admin/news" class="flex flex-col items-center gap-1 text-primary">
          <Icon name="heroicons:newspaper" class="w-5 h-5" />
          <span class="text-xs">Новости</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer;
}

.nav-item-active {
  @apply bg-gradient-to-r from-primary/20 to-secondary/10 text-[var(--text-primary)] font-semibold;
}
</style>
