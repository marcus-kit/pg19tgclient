<script setup lang="ts">
useHead({
  title: 'Телевидение — ПЖ19'
})

const channels = [
  { category: 'Эфирные', count: 23, icon: 'heroicons:tv' },
  { category: 'Новостные', count: 14, icon: 'heroicons:newspaper' },
  { category: 'Спортивные', count: 15, icon: 'heroicons:trophy' },
  { category: 'Детские', count: 13, icon: 'heroicons:face-smile' },
  { category: 'Познавательные', count: 38, icon: 'heroicons:academic-cap' },
  { category: 'Развлекательные', count: 42, icon: 'heroicons:sparkles' },
  { category: 'Музыкальные', count: 16, icon: 'heroicons:musical-note' },
  { category: 'Кино', count: 31, icon: 'heroicons:film' },
  { category: 'HD-каналы', count: 23, icon: 'heroicons:play' },
  { category: '4K-каналы', count: 2, icon: 'heroicons:play-circle' },
  { category: 'Региональные', count: 4, icon: 'heroicons:map-pin' },
  { category: 'Для взрослых', count: 5, icon: 'heroicons:lock-closed' }
]
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-secondary/20 -top-32 -left-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:tv" class="w-10 h-10 text-secondary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Цифровое <span class="text-gradient-secondary">телевидение</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-4 opacity-0 animate-fade-in-up stagger-2">
            <span class="text-5xl font-bold text-secondary">191</span> <span class="text-[var(--text-secondary)]">канал в HD и 4K качестве</span>
          </p>
          <p class="text-[var(--text-muted)] mb-10 opacity-0 animate-fade-in-up stagger-2">
            Включено в паевой взнос без дополнительной платы
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

    <!-- Channels -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-[var(--text-primary)] text-center mb-12">Категории каналов</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(item, index) in channels"
            :key="item.category"
            class="glass-card p-5 rounded-xl opacity-0 animate-fade-in-up"
            :class="`stagger-${(index % 6) + 1}`"
          >
            <div class="flex items-center gap-3 mb-2">
              <Icon :name="item.icon" class="w-5 h-5 text-secondary" />
              <span class="text-3xl font-bold text-[var(--text-primary)]">{{ item.count }}</span>
            </div>
            <p class="text-[var(--text-muted)] text-sm">{{ item.category }}</p>
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
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="heroicons:tv" class="w-10 h-10 text-secondary" />
              </div>
              <div class="flex-grow">
                <h3 class="font-bold text-[var(--text-primary)] text-xl mb-2">ТВ-приставка Imaqliq G-Box</h3>
                <p class="text-[var(--text-muted)] mb-4">Smart TV приставка с поддержкой 4K</p>
                <p class="text-2xl font-bold text-secondary">+99 <span class="text-lg text-[var(--text-muted)]">₽/мес</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
