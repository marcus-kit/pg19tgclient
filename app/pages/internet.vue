<script setup lang="ts">
useHead({
  title: 'Интернет — ПЖ19'
})

const features = [
  { icon: 'heroicons:no-symbol', title: 'Мы не режем скорость', description: 'Вы получаете всю полосу канала. Никаких искусственных ограничений' },
  { icon: 'heroicons:bolt', title: 'До 1000 Мбит/с', description: 'Максимальная скорость зависит только от вашего оборудования' },
  { icon: 'heroicons:device-tablet', title: '10+ устройств', description: 'Стабильная работа всех гаджетов одновременно' },
  { icon: 'heroicons:arrow-down-tray', title: '1 ГБ за 20 сек', description: 'Скачивание файлов на максимальной скорости' }
]
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-primary/20 -top-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:wifi" class="w-10 h-10 text-primary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Интернет <span class="text-gradient-primary">без ограничений</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-2">
            Мы не режем скорость — вы получаете всю полосу канала до 1000 Мбит/с.
            Никаких тарифных ограничений, скорость зависит только от вашего оборудования.
          </p>
          <NuxtLink
            to="/connect"
            class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg opacity-0 animate-fade-in-up stagger-3"
          >
            <span>Подключиться</span>
            <Icon name="heroicons:arrow-right" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up"
            :class="`stagger-${index + 1}`"
          >
            <div class="icon-container mb-4">
              <Icon :name="feature.icon" class="w-6 h-6 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">{{ feature.title }}</h3>
            <p class="text-[var(--text-muted)]">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Equipment -->
    <section class="py-20 md:py-32 mesh-gradient-dark">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-[var(--text-primary)] text-center mb-12">Оборудование</h2>
        <div class="max-w-lg mx-auto">
          <div class="glass-card rounded-3xl p-8">
            <div class="flex items-start gap-6">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="heroicons:wifi" class="w-10 h-10 text-primary" />
              </div>
              <div class="flex-grow">
                <h3 class="font-bold text-[var(--text-primary)] text-xl mb-2">Wi-Fi роутер SNR-CPE-ME2</h3>
                <p class="text-[var(--text-muted)] mb-4">Двухдиапазонный роутер с поддержкой Wi-Fi 5</p>
                <p class="text-2xl font-bold text-primary">+99 <span class="text-lg text-[var(--text-muted)]">₽/мес</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
