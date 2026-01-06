<script setup lang="ts">
const services = [
  {
    title: 'Интернет',
    description: 'Мы не режем скорость. Канал до 1000 Мбит/с — вся полоса ваша',
    icon: 'heroicons:wifi',
    color: 'primary',
    href: '/internet',
    features: ['Скорость не ограничена', 'До 1000 Мбит/с', '10+ устройств'],
    gradient: 'from-primary/20 to-primary/5'
  },
  {
    title: 'Телевидение',
    description: '191 канал цифрового ТВ в HD и 4K качестве',
    icon: 'heroicons:tv',
    color: 'secondary',
    href: '/tv',
    features: ['191 канал', 'HD и 4K', 'Архив передач'],
    gradient: 'from-secondary/20 to-secondary/5'
  },
  {
    title: 'Мобильная связь',
    description: 'Выгодные тарифы на мобильную связь для участников',
    icon: 'heroicons:device-phone-mobile',
    color: 'accent',
    href: '/mobile',
    features: ['Безлимит', 'Роуминг', 'eSIM'],
    gradient: 'from-accent/20 to-accent/5'
  },
  {
    title: 'Видеонаблюдение',
    description: 'Облачное видеонаблюдение для дома и бизнеса',
    icon: 'heroicons:video-camera',
    color: 'info',
    href: '/cctv',
    features: ['Облачный архив', '24/7 запись', 'Уведомления'],
    gradient: 'from-info/20 to-info/5'
  },
  {
    title: 'Умный домофон',
    description: 'Видеодомофон с удалённым доступом через смартфон',
    icon: 'heroicons:home',
    color: 'primary',
    href: '/intercom',
    features: ['Видеозвонок', 'Удалённый доступ', 'История'],
    gradient: 'from-primary/20 to-secondary/5'
  }
]

const colorClasses: Record<string, { icon: string; glow: string; tag: string }> = {
  primary: {
    icon: 'text-primary',
    glow: 'group-hover:shadow-glow-primary',
    tag: 'bg-primary/10 text-primary border-primary/20'
  },
  secondary: {
    icon: 'text-secondary',
    glow: 'group-hover:shadow-glow-secondary',
    tag: 'bg-secondary/10 text-secondary border-secondary/20'
  },
  accent: {
    icon: 'text-accent',
    glow: 'group-hover:shadow-glow-accent',
    tag: 'bg-accent/10 text-accent border-accent/20'
  },
  info: {
    icon: 'text-info',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,84,166,0.4)]',
    tag: 'bg-info/10 text-info border-info/20'
  }
}
</script>

<template>
  <section class="py-20 md:py-32 relative overflow-hidden" :style="{ background: 'var(--bg-base)' }">
    <!-- Background decoration -->
    <div class="absolute inset-0 mesh-gradient-subtle opacity-50"></div>

    <div class="container mx-auto px-4 relative z-10">
      <!-- Header -->
      <div class="text-center mb-16">
        <span class="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4 opacity-0 animate-fade-in-up">
          Услуги сообщества
        </span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
          Всё для комфортной
          <span class="text-gradient-primary"> цифровой жизни</span>
        </h2>
        <p class="text-lg text-[var(--text-muted)] max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-2">
          Интернет, телевидение, мобильная связь и другие сервисы —
          всё в одном сообществе на выгодных условиях
        </p>
      </div>

      <!-- Services grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <NuxtLink
          v-for="(service, index) in services"
          :key="service.href"
          :to="service.href"
          class="group glass-card rounded-3xl p-8 transition-all duration-500 opacity-0 animate-fade-in-up"
          :class="[`stagger-${index + 1}`, colorClasses[service.color].glow]"
        >
          <!-- Icon container -->
          <div
            class="icon-container mb-6"
            :class="`bg-gradient-to-br ${service.gradient}`"
          >
            <Icon
              :name="service.icon"
              :class="['w-7 h-7', colorClasses[service.color].icon]"
            />
          </div>

          <!-- Title -->
          <h3 class="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-primary transition-colors">
            {{ service.title }}
          </h3>

          <!-- Description -->
          <p class="text-[var(--text-muted)] mb-6 leading-relaxed">
            {{ service.description }}
          </p>

          <!-- Features -->
          <div class="flex flex-wrap gap-2 mb-6">
            <span
              v-for="feature in service.features"
              :key="feature"
              :class="[
                'text-xs px-3 py-1.5 rounded-full border font-medium',
                colorClasses[service.color].tag
              ]"
            >
              {{ feature }}
            </span>
          </div>

          <!-- Arrow link -->
          <div class="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-primary transition-colors">
            <span class="text-sm font-medium">Подробнее</span>
            <Icon
              name="heroicons:arrow-right"
              class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
            />
          </div>
        </NuxtLink>
      </div>

      <!-- Bottom CTA -->
      <div class="text-center mt-16 opacity-0 animate-fade-in-up stagger-6">
        <p class="text-[var(--text-muted)] mb-6">
          Не нашли нужную услугу? Мы постоянно расширяем возможности
        </p>
        <NuxtLink
          to="/connect"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <span>Связаться с нами</span>
          <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
