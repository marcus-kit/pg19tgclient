<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

const authStore = useAuthStore()

// Mock news data
const news = [
  {
    id: 1,
    title: 'Плановые работы 15 февраля',
    date: '10 янв 2024',
    preview: 'С 02:00 до 06:00 возможны кратковременные перебои в работе интернета.'
  },
  {
    id: 2,
    title: 'Новогодние праздники',
    date: '28 дек 2023',
    preview: 'Поздравляем с наступающим Новым годом! Офис работает до 30 декабря.'
  },
  {
    id: 3,
    title: 'Обновление тарифов',
    date: '15 дек 2023',
    preview: 'С 1 января доступны новые тарифы со скоростью до 1 Гбит/с.'
  }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        Добро пожаловать, {{ authStore.user?.firstName }}!
      </h1>
      <p class="text-[var(--text-muted)] mt-1">Договор № {{ authStore.account?.contractNumber }}</p>
    </div>

    <!-- Main Grid -->
    <div class="grid md:grid-cols-2 gap-4">
      <DashboardBalanceCard />
      <DashboardConnectionCard />
    </div>

    <!-- Special Offer -->
    <section>
      <UCard class="p-0 overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/5">
        <div class="p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div class="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name="heroicons:gift" class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                Специальное предложение
              </span>
            </div>
            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-1">
              ТВ Расширенный — месяц бесплатно
            </h3>
            <p class="text-[var(--text-muted)] text-sm">
              191 канал + кинозалы. Подключите сейчас и смотрите бесплатно до 28 февраля!
            </p>
          </div>
          <div class="flex-shrink-0">
            <UButton variant="primary">
              Подключить
            </UButton>
          </div>
        </div>
      </UCard>
    </section>

    <!-- Community News -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">Новости сообщества</h2>
        <NuxtLink to="/lk/support" class="text-sm text-primary hover:text-primary-400 transition-colors">
          Все новости
        </NuxtLink>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <UCard v-for="item in news" :key="item.id" hover class="p-5">
          <p class="text-xs text-[var(--text-muted)] mb-2">{{ item.date }}</p>
          <h3 class="font-medium text-[var(--text-primary)] mb-2">{{ item.title }}</h3>
          <p class="text-sm text-[var(--text-secondary)] line-clamp-2">{{ item.preview }}</p>
        </UCard>
      </div>
    </section>
  </div>
</template>
