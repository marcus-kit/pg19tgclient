<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

const authStore = useAuthStore()

// Mock services data
const activeServices = [
  {
    id: 1,
    name: 'Интернет 500 Мбит/с',
    type: 'internet',
    price: 500,
    status: 'active',
    icon: 'heroicons:wifi',
    description: 'Безлимитный интернет до 500 Мбит/с'
  },
  {
    id: 2,
    name: 'ТВ Базовый',
    type: 'tv',
    price: 200,
    status: 'active',
    icon: 'heroicons:tv',
    description: '120 каналов в HD качестве'
  }
]

const availableServices = [
  {
    id: 3,
    name: 'Интернет 1000 Мбит/с',
    type: 'internet',
    price: 800,
    icon: 'heroicons:bolt',
    description: 'Максимальная скорость до 1 Гбит/с'
  },
  {
    id: 4,
    name: 'ТВ Расширенный',
    type: 'tv',
    price: 350,
    icon: 'heroicons:tv',
    description: '191 канал + кинозалы'
  },
  {
    id: 5,
    name: 'Статический IP',
    type: 'addon',
    price: 150,
    icon: 'heroicons:globe-alt',
    description: 'Фиксированный внешний IP-адрес'
  },
  {
    id: 6,
    name: 'Антивирус',
    type: 'addon',
    price: 99,
    icon: 'heroicons:shield-check',
    description: 'Защита до 3 устройств'
  }
]

const getStatusColor = (status: string) => {
  return status === 'active' ? 'bg-accent/20 text-accent' : 'bg-gray-600/20 text-gray-400'
}

const getStatusText = (status: string) => {
  return status === 'active' ? 'Активна' : 'Неактивна'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Услуги</h1>
      <p class="text-[var(--text-muted)] mt-1">Управление подключенными услугами</p>
    </div>

    <!-- Active Services -->
    <section>
      <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Подключенные услуги</h2>
      <div class="grid gap-4">
        <UCard v-for="service in activeServices" :key="service.id" class="p-0 overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
              <Icon :name="service.icon" class="w-6 h-6 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-semibold text-[var(--text-primary)]">{{ service.name }}</h3>
                  <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ service.description }}</p>
                </div>
                <UBadge :class="getStatusColor(service.status)">
                  {{ getStatusText(service.status) }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between mt-4">
                <span class="text-lg font-bold text-[var(--text-primary)]">{{ service.price }} <span class="text-sm font-normal text-[var(--text-muted)]">руб/мес</span></span>
                <button class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  Подробнее
                </button>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <!-- Available Services -->
    <section>
      <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Доступные услуги</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <UCard v-for="service in availableServices" :key="service.id" class="p-0 overflow-hidden hover:border-primary/30 transition-colors cursor-pointer">
          <div class="p-5">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--glass-bg);">
                <Icon :name="service.icon" class="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-[var(--text-primary)]">{{ service.name }}</h3>
                <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ service.description }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4 pt-4" style="border-top: 1px solid var(--glass-border);">
              <span class="font-semibold text-[var(--text-primary)]">{{ service.price }} <span class="text-sm font-normal text-[var(--text-muted)]">руб/мес</span></span>
              <UButton size="sm" variant="secondary">
                Подключить
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>
