<script setup lang="ts">
const features = [
  {
    icon: 'heroicons:bolt',
    title: 'Никаких ограничений',
    description: 'Каждый участник получает максимальную скорость, доступную в точке подключения — до 1000 Мбит/с'
  },
  {
    icon: 'heroicons:banknotes',
    title: 'Взносы, а не оплата услуг',
    description: 'Паевые взносы идут только на содержание и развитие инфраструктуры сообщества'
  },
  {
    icon: 'heroicons:user-group',
    title: 'Общее управление',
    description: 'Один пайщик = один голос. Каждый участник может влиять на развитие сообщества'
  },
  {
    icon: 'heroicons:arrow-trending-up',
    title: 'Чем нас больше — тем лучше',
    description: 'Новые участники усиливают возможности всего сообщества и качество связи'
  }
]

const included = [
  { text: 'Интернет до 1000 Мбит/с', icon: 'heroicons:wifi' },
  { text: 'Цифровое ТВ 191 канал', icon: 'heroicons:tv' },
  { text: 'Техподдержка 24/7', icon: 'heroicons:phone' },
  { text: 'Право голоса', icon: 'heroicons:hand-raised' }
]
</script>

<template>
  <section class="py-20 md:py-32 mesh-gradient-dark relative overflow-hidden">
    <!-- Decorative elements -->
    <div class="floating-shape w-[600px] h-[600px] bg-primary/10 -bottom-48 -left-48"></div>
    <div class="floating-shape w-[400px] h-[400px] bg-secondary/10 -top-32 -right-32"></div>

    <div class="container mx-auto px-4 relative z-10">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <!-- Content -->
        <div>
          <span class="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4 opacity-0 animate-fade-in-up">
            Наши преимущества
          </span>

          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Почему мы —
            <span class="text-gradient-primary">сообщество</span>,
            <br class="hidden md:block" />
            а не провайдер?
          </h2>

          <p class="text-lg text-[var(--text-muted)] mb-12 leading-relaxed opacity-0 animate-fade-in-up stagger-2">
            Коммерческие провайдеры ориентированы на прибыль.
            Мы — на <span class="text-[var(--text-primary)]">доверие, прозрачность и равноправие</span>.
            Каждый член сообщества — не клиент, а полноправный участник.
          </p>

          <div class="grid sm:grid-cols-2 gap-6">
            <div
              v-for="(feature, index) in features"
              :key="index"
              class="group opacity-0 animate-fade-in-up"
              :class="`stagger-${index + 2}`"
            >
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-xl glass-card flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon :name="feature.icon" class="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-primary transition-colors">
                    {{ feature.title }}
                  </h3>
                  <p class="text-[var(--text-muted)] text-sm leading-relaxed">
                    {{ feature.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing card -->
        <div class="relative opacity-0 animate-fade-in-up stagger-5">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20 rounded-[40px] blur-2xl opacity-60"></div>

          <div class="pricing-card relative p-8 md:p-10">
            <!-- Header -->
            <div class="text-center mb-10">
              <div class="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6">
                <Icon name="heroicons:sparkles" class="w-4 h-4 text-primary" />
                <span class="text-sm text-[var(--text-secondary)]">Единый взнос</span>
              </div>

              <p class="text-[var(--text-muted)] mb-3">Паевой взнос от</p>
              <div class="flex items-baseline justify-center gap-2">
                <span class="text-6xl md:text-7xl font-bold text-[var(--text-primary)]">699</span>
                <div class="text-left">
                  <span class="text-2xl text-[var(--text-muted)]">₽</span>
                  <p class="text-sm text-[var(--text-muted)]">в месяц</p>
                </div>
              </div>
              <p class="text-sm text-[var(--text-muted)] mt-3">
                Зависит от локации подключения
              </p>
            </div>

            <!-- Included -->
            <div class="space-y-4 mb-10">
              <div
                v-for="item in included"
                :key="item.text"
                class="flex items-center gap-4 p-4 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-hover-bg)] transition-colors"
              >
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <Icon :name="item.icon" class="w-5 h-5 text-accent" />
                </div>
                <span class="text-[var(--text-primary)] font-medium">{{ item.text }}</span>
              </div>
            </div>

            <!-- CTA -->
            <NuxtLink
              to="/connect"
              class="group btn-primary flex items-center justify-center gap-3 w-full py-5 text-lg"
            >
              <span>Вступить в сообщество</span>
              <Icon
                name="heroicons:arrow-right"
                class="w-5 h-5 transition-transform group-hover:translate-x-1"
              />
            </NuxtLink>

            <!-- Legal note -->
            <p class="text-xs text-[var(--text-muted)] text-center mt-6 flex items-center justify-center gap-2">
              <Icon name="heroicons:shield-check" class="w-4 h-4" />
              Деятельность в рамках закона РФ о потребительской кооперации
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
