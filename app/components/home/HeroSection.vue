<script setup lang="ts">
const stats = [
  { value: '191', unit: 'канал', label: 'ТВ', color: 'secondary' },
  { value: '699', unit: '₽/мес', label: 'от', color: 'accent' }
]
</script>

<template>
  <section class="relative min-h-screen flex items-center mesh-gradient-hero overflow-hidden pt-20">
    <!-- Animated network pattern -->
    <div class="absolute inset-0 network-pattern opacity-30"></div>

    <!-- Floating decorative shapes -->
    <div class="floating-shape w-[500px] h-[500px] bg-primary/20 top-1/4 -left-48 animate-float"></div>
    <div class="floating-shape w-[400px] h-[400px] bg-secondary/15 bottom-1/4 -right-32 animate-float" style="animation-delay: -2s;"></div>
    <div class="floating-shape w-[300px] h-[300px] bg-info/10 top-1/2 left-1/3 animate-float" style="animation-delay: -4s;"></div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-16 md:py-24 relative z-10">
      <div class="max-w-5xl mx-auto">
        <!-- Main content grid -->
        <div class="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          <!-- Text content -->
          <div class="lg:col-span-3 text-center lg:text-left">
            <!-- Badge -->
            <div
              class="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2.5 mb-8 opacity-0 animate-fade-in-up"
            >
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              <span class="text-sm font-medium text-[var(--text-secondary)]">Более 100 000 участников сообщества</span>
            </div>

            <!-- Heading -->
            <h1
              class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] opacity-0 animate-fade-in-up stagger-1"
            >
              <img src="/logo.png" alt="ПЖ19" class="inline-block h-12 md:h-16 lg:h-20 align-baseline mr-2" />
              <span class="text-[var(--text-primary)]">—</span>
              <br class="hidden sm:block" />
              <span class="text-gradient-primary">сообщество</span>
              <span class="text-[var(--text-primary)]">,</span>
              <br />
              <span class="text-[var(--text-muted)] font-normal">а не провайдер</span>
            </h1>

            <!-- Subheading -->
            <p
              class="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-0 animate-fade-in-up stagger-2"
            >
              Закрытое сообщество для совместного доступа к услугам связи.
              <span class="text-[var(--text-secondary)]">Мы не продаём интернет</span> — мы вместе строим инфраструктуру для себя.
            </p>

            <!-- CTA Buttons -->
            <div
              class="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 opacity-0 animate-fade-in-up stagger-3"
            >
              <NuxtLink
                to="/connect"
                class="group w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-3 px-8 py-4 text-lg"
              >
                <span>Вступить в сообщество</span>
                <Icon
                  name="heroicons:arrow-right"
                  class="w-5 h-5 transition-transform group-hover:translate-x-1"
                />
              </NuxtLink>
              <NuxtLink
                to="/about"
                class="w-full sm:w-auto btn-secondary inline-flex items-center justify-center gap-2 text-lg"
              >
                <Icon name="heroicons:play-circle" class="w-5 h-5" />
                <span>О нас</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Stats cards -->
          <div class="lg:col-span-2">
            <div class="grid gap-4 max-w-sm mx-auto lg:ml-auto">
              <!-- Speed card - special emphasis -->
              <div class="glass-card rounded-2xl p-6 opacity-0 animate-fade-in-up stagger-2 border-primary/30">
                <div class="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-1">
                  <Icon name="heroicons:bolt" class="w-4 h-4 text-primary" />
                  <span>Скорость интернета</span>
                </div>
                <p class="text-xl md:text-2xl font-bold text-primary mb-1">
                  Без ограничений
                </p>
                <p class="text-[var(--text-muted)] text-sm">
                  Канал до <span class="text-[var(--text-secondary)] font-semibold">1000 Мбит/с</span> — вся скорость ваша
                </p>
              </div>

              <div
                v-for="(stat, index) in stats"
                :key="stat.label"
                class="glass-card rounded-2xl p-6 opacity-0 animate-fade-in-up"
                :class="`stagger-${index + 3}`"
              >
                <div class="flex items-baseline gap-2">
                  <span
                    class="text-4xl md:text-5xl font-bold"
                    :class="{
                      'text-primary': stat.color === 'primary',
                      'text-secondary': stat.color === 'secondary',
                      'text-accent': stat.color === 'accent'
                    }"
                  >
                    {{ stat.value }}
                  </span>
                  <span class="text-lg text-[var(--text-muted)]">{{ stat.unit }}</span>
                </div>
                <p class="text-[var(--text-muted)] text-sm mt-1">{{ stat.label }}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom gradient fade (instead of wave) -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent"></div>
  </section>
</template>
