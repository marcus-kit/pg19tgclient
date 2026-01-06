<script setup lang="ts">
useHead({
  title: 'Бизнесу — ПЖ19'
})

const services = [
  { icon: 'heroicons:wifi', title: 'Корпоративный интернет', description: 'Высокоскоростной интернет для офиса с гарантированной полосой' },
  { icon: 'heroicons:server', title: 'Выделенные каналы', description: 'Индивидуальные решения для вашего бизнеса' },
  { icon: 'heroicons:video-camera', title: 'Видеонаблюдение', description: 'Комплексные системы безопасности для бизнеса' },
  { icon: 'heroicons:phone', title: 'Телефония', description: 'IP-телефония и виртуальная АТС' }
]
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-info/20 -top-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:building-office" class="w-10 h-10 text-info" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Решения для <span class="text-info">бизнеса</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-10 opacity-0 animate-fade-in-up stagger-2">
            Корпоративные услуги связи для компаний любого масштаба
          </p>
          <NuxtLink
            to="/connect"
            class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg opacity-0 animate-fade-in-up stagger-3"
          >
            <span>Получить консультацию</span>
            <Icon name="heroicons:arrow-right" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Services -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-[var(--text-primary)] text-center mb-12">Услуги для бизнеса</h2>
        <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div
            v-for="(service, index) in services"
            :key="service.title"
            class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up"
            :class="`stagger-${index + 1}`"
          >
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-info/20 to-info/5 flex items-center justify-center flex-shrink-0">
                <Icon :name="service.icon" class="w-7 h-7 text-info" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">{{ service.title }}</h3>
                <p class="text-[var(--text-muted)]">{{ service.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="py-20 md:py-32 mesh-gradient-dark">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">
            Индивидуальный подход
          </h2>
          <p class="text-lg text-[var(--text-muted)] mb-10">
            Наши специалисты подберут оптимальное решение для вашего бизнеса
          </p>

          <div class="glass-card rounded-3xl p-8">
            <div class="space-y-6 mb-8">
              <a href="mailto:business@pg19.ru" class="flex items-center justify-center gap-4 group">
                <div class="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <Icon name="heroicons:envelope" class="w-6 h-6 text-info" />
                </div>
                <span class="text-[var(--text-primary)] text-lg group-hover:text-info transition-colors">business@pg19.ru</span>
              </a>
              <a href="tel:+78001234567" class="flex items-center justify-center gap-4 group">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="heroicons:phone" class="w-6 h-6 text-primary" />
                </div>
                <span class="text-[var(--text-primary)] text-lg group-hover:text-primary transition-colors">8 (800) 123-45-67</span>
              </a>
            </div>

            <NuxtLink
              to="/connect"
              class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg"
            >
              <span>Оставить заявку</span>
              <Icon name="heroicons:arrow-right" class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
