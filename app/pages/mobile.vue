<script setup lang="ts">
useHead({
  title: 'Мобильная связь — ПЖ19'
})
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-accent/20 -top-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:device-phone-mobile" class="w-10 h-10 text-accent" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Мобильная <span class="text-accent">связь</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-8 opacity-0 animate-fade-in-up stagger-2">
            Выгодные тарифы на мобильную связь для участников сообщества
          </p>

          <!-- Coming soon -->
          <div class="inline-flex items-center gap-3 glass-card rounded-full px-6 py-3 opacity-0 animate-fade-in-up stagger-3">
            <Icon name="heroicons:clock" class="w-5 h-5 text-accent" />
            <span class="font-medium text-[var(--text-primary)]">Скоро будет доступно</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Placeholder -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center">
          <div class="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Icon name="heroicons:signal" class="w-12 h-12 text-[var(--text-muted)]" />
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
            Мы работаем над этим
          </h2>
          <p class="text-[var(--text-muted)] mb-10 text-lg">
            Услуга мобильной связи находится в разработке.
            Оставьте заявку, и мы сообщим вам о запуске.
          </p>
          <NuxtLink
            to="/connect"
            class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg"
          >
            <span>Оставить заявку</span>
            <Icon name="heroicons:arrow-right" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
