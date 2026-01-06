<script setup lang="ts">
useHead({
  title: 'Новости — ПЖ19'
})

const news = [
  {
    id: 1,
    title: 'Расширение зоны покрытия',
    excerpt: 'Мы подключили новые районы к сети сообщества. Теперь ещё больше участников могут пользоваться нашими услугами.',
    date: '2024-01-15',
    category: 'Развитие'
  },
  {
    id: 2,
    title: 'Обновление тарифов',
    excerpt: 'С нового месяца изменились условия паевых взносов. Подробности в личном кабинете.',
    date: '2024-01-10',
    category: 'Объявление'
  },
  {
    id: 3,
    title: 'Новые ТВ-каналы',
    excerpt: 'Добавили 10 новых каналов в пакет цифрового телевидения без изменения стоимости взноса.',
    date: '2024-01-05',
    category: 'Услуги'
  }
]

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
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
            <Icon name="heroicons:newspaper" class="w-10 h-10 text-secondary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            <span class="text-gradient-secondary">Новости</span> сообщества
          </h1>
          <p class="text-xl text-[var(--text-muted)] opacity-0 animate-fade-in-up stagger-2">
            Актуальная информация о развитии ПЖ19
          </p>
        </div>
      </div>
    </section>

    <!-- News list -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto space-y-6">
          <article
            v-for="(item, index) in news"
            :key="item.id"
            class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up"
            :class="`stagger-${index + 1}`"
          >
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 bg-secondary/20 text-secondary text-sm font-medium rounded-full">
                {{ item.category }}
              </span>
              <span class="text-sm text-[var(--text-muted)]">
                {{ formatDate(item.date) }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-[var(--text-primary)] mb-3">
              {{ item.title }}
            </h2>
            <p class="text-[var(--text-muted)]">
              {{ item.excerpt }}
            </p>
          </article>
        </div>

        <!-- Placeholder for empty state -->
        <div v-if="news.length === 0" class="max-w-2xl mx-auto text-center py-12">
          <div class="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Icon name="heroicons:newspaper" class="w-12 h-12 text-[var(--text-muted)]" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-4">Новостей пока нет</h2>
          <p class="text-[var(--text-muted)]">
            Следите за обновлениями — скоро здесь появятся новости сообщества
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
