<script setup lang="ts">
useHead({
  title: 'Умный домофон — ПЖ19'
})

const features = [
  { icon: 'heroicons:video-camera', title: 'Видеозвонок', description: 'Видите, кто звонит в дверь' },
  { icon: 'heroicons:device-phone-mobile', title: 'Удалённый доступ', description: 'Открывайте дверь через смартфон' },
  { icon: 'heroicons:clock', title: 'История звонков', description: 'Просмотр всех посещений' },
  { icon: 'heroicons:chat-bubble-left-right', title: 'Двусторонняя связь', description: 'Разговаривайте с посетителями' }
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
            <Icon name="heroicons:home" class="w-10 h-10 text-primary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Умный <span class="text-gradient-primary">домофон</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-2">
            Видеодомофон с удалённым доступом — управляйте домом со смартфона
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
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/5 flex items-center justify-center mb-4">
              <Icon :name="feature.icon" class="w-7 h-7 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">{{ feature.title }}</h3>
            <p class="text-[var(--text-muted)]">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
