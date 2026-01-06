<script setup lang="ts">
useHead({
  title: 'О сообществе — ПЖ19'
})

const values = [
  { icon: 'heroicons:shield-check', title: 'Доверие', description: 'Прозрачные отношения между участниками' },
  { icon: 'heroicons:eye', title: 'Прозрачность', description: 'Открытая информация о расходах и решениях' },
  { icon: 'heroicons:scale', title: 'Равноправие', description: 'Каждый участник имеет равные права' },
  { icon: 'heroicons:users', title: 'Сообщество', description: 'Вместе мы сильнее и эффективнее' }
]
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[500px] h-[500px] bg-primary/15 -bottom-32 -left-32"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-secondary/15 -top-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in-up">
            О сообществе
            <span class="text-gradient-primary">ПЖ19</span>
          </h1>
          <p class="text-xl text-gray-400 opacity-0 animate-fade-in-up stagger-1">
            Закрытое сообщество из более чем 100 000 участников,
            объединившихся для совместного доступа к услугам связи на некоммерческой основе
          </p>
        </div>
      </div>
    </section>

    <!-- Main content -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <div class="space-y-12">
            <div class="opacity-0 animate-fade-in-up">
              <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">ПЖ19 — сообщество, а не провайдер</h2>
              <p class="text-gray-400 leading-relaxed">
                Мы не продаём интернет — мы вместе строим и развиваем инфраструктуру для себя.
                В условиях, когда коммерческие провайдеры ориентированы исключительно на прибыль,
                мы предлагаем иной подход — основанный на доверии, прозрачности и равноправии.
              </p>
            </div>

            <div class="opacity-0 animate-fade-in-up stagger-1">
              <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Почему это работает иначе</h2>
              <p class="text-gray-400 leading-relaxed">
                Каждый член сообщества — не клиент, а полноправный участник с правом голоса
                в принятии решений. Наши участники не оплачивают услуги — они вносят регулярные
                паевые взносы, необходимые для развития и поддержания инфраструктуры.
              </p>
            </div>

            <div class="opacity-0 animate-fade-in-up stagger-2">
              <h2 class="text-2xl md:text-3xl font-bold text-white mb-6">Чем мы отличаемся</h2>
              <div class="grid gap-4">
                <div class="glass-card rounded-xl p-5">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="heroicons:bolt" class="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-white mb-1">Никаких искусственных ограничений</h3>
                      <p class="text-gray-400 text-sm">Каждый участник получает максимальную скорость, доступную в точке подключения (до 1000 Мбит/с)</p>
                    </div>
                  </div>
                </div>
                <div class="glass-card rounded-xl p-5">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="heroicons:banknotes" class="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-white mb-1">Взносы, а не оплата услуг</h3>
                      <p class="text-gray-400 text-sm">Средства идут только на содержание и развитие инфраструктуры</p>
                    </div>
                  </div>
                </div>
                <div class="glass-card rounded-xl p-5">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="heroicons:user-group" class="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-white mb-1">Общее управление</h3>
                      <p class="text-gray-400 text-sm">Один пайщик = один голос</p>
                    </div>
                  </div>
                </div>
                <div class="glass-card rounded-xl p-5">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-white mb-1">Чем нас больше — тем лучше каждому</h3>
                      <p class="text-gray-400 text-sm">Новые участники усиливают возможности всего сообщества</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="opacity-0 animate-fade-in-up stagger-3">
              <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Как устроены взносы</h2>
              <p class="text-gray-400 leading-relaxed">
                Паевой взнос зависит от локации подключения. Минимальный — 699 ₽/мес.
                Все средства расходуются строго по уставным задачам кооператива.
              </p>
            </div>

            <div class="opacity-0 animate-fade-in-up stagger-4">
              <p class="text-sm text-gray-500 italic flex items-center gap-2">
                <Icon name="heroicons:shield-check" class="w-4 h-4" />
                Деятельность ПЖ19 ведётся в соответствии с законодательством РФ
                о потребительской кооперации и уставом кооператива.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="py-20 md:py-32 mesh-gradient-dark">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-white text-center mb-12">Наши ценности</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(value, index) in values"
            :key="value.title"
            class="glass-card p-6 rounded-2xl text-center opacity-0 animate-fade-in-up"
            :class="`stagger-${index + 1}`"
          >
            <div class="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon :name="value.icon" class="w-7 h-7 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">{{ value.title }}</h3>
            <p class="text-gray-400 text-sm">{{ value.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
          Присоединяйтесь к сообществу
        </h2>
        <p class="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Станьте частью ПЖ19 и получите доступ к качественной связи
          на некоммерческих условиях
        </p>
        <NuxtLink
          to="/connect"
          class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg"
        >
          <span>Вступить в сообщество</span>
          <Icon name="heroicons:arrow-right" class="w-5 h-5" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
