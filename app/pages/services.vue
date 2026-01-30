<script setup lang="ts">
import type { Subscription, Service } from '~/types/service'
import { subscriptionStatusLabels, subscriptionStatusColors } from '~/types/service'

definePageMeta({
  layout: 'twa',
})

const router = useRouter()
const { fetchServices, fetchSubscriptions } = useServices()
const { createTicket } = useTickets()

// Состояние для запроса подключения
const connectingServiceId = ref<string | null>(null)

// Загружаем данные (lazy - не блокирует навигацию)
const { services, pending: servicesPending, error: servicesError } = fetchServices()
const { subscriptions, pending: subsPending, error: subsError } = fetchSubscriptions()

const pending = computed(() => servicesPending.value || subsPending.value)
const error = computed(() => servicesError.value || subsError.value)

// ID подключенных услуг
const subscribedServiceIds = computed(() => {
  return new Set(subscriptions.value.map(s => s.serviceId))
})

// Доступные для подключения услуги
const availableServices = computed(() => {
  return services.value.filter(s => !subscribedServiceIds.value.has(s.id))
})

// Форматирование цены
function formatPrice(kopeks: number) {
  return (kopeks / 100).toLocaleString('ru-RU')
}

// Получить цену подписки (custom или стандартная)
function getSubscriptionPrice(sub: Subscription) {
  return sub.customPrice ?? sub.service?.priceMonthly ?? 0
}

// Статус подписки
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    green: 'bg-accent/20 text-accent',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    gray: 'bg-gray-600/20 text-gray-400',
  }
  return colorMap[subscriptionStatusColors[status as keyof typeof subscriptionStatusColors]] || colorMap.gray
}

// Иконка услуги
function getServiceIcon(service: Service | undefined) {
  return service?.icon || 'heroicons:cube'
}

// Запрос на подключение услуги
async function requestConnection(service: Service) {
  connectingServiceId.value = service.id
  try {
    const { ticket, error } = await createTicket({
      subject: `Заявка на подключение: ${service.name}`,
      description: `Прошу подключить услугу "${service.name}".\n\nОписание услуги: ${service.description || 'Не указано'}\nСтоимость: ${(service.priceMonthly / 100).toLocaleString('ru-RU')} руб/мес`,
      category: 'connection',
    })

    if (error) {
      console.error('Error creating connection ticket:', error)
      alert('Ошибка при создании заявки. Попробуйте позже.')
      return
    }

    if (ticket) {
      // Редирект на страницу созданного тикета
      router.push(`/support/${ticket.id}`)
    }
  }
  finally {
    connectingServiceId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        Услуги
      </h1>
      <p class="text-[var(--text-muted)] mt-1">
        Управление подключенными услугами
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="pending"
      class="space-y-6"
    >
      <section>
        <div class="h-6 bg-[var(--glass-bg)] rounded w-40 mb-4" />
        <div class="space-y-4">
          <UCard
            v-for="i in 2"
            :key="i"
            class="animate-pulse"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-[var(--glass-bg)]" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-[var(--glass-bg)] rounded w-1/3" />
                <div class="h-3 bg-[var(--glass-bg)] rounded w-1/2" />
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </div>

    <!-- Error State -->
    <UCard
      v-else-if="error"
      class="border-red-500/30"
    >
      <div class="text-center py-4">
        <Icon
          name="heroicons:exclamation-triangle"
          class="w-12 h-12 text-red-400 mx-auto mb-4"
        />
        <p class="text-red-400 mb-4">
          Ошибка загрузки услуг
        </p>
      </div>
    </UCard>

    <template v-else>
      <!-- Active Services (Subscriptions) -->
      <section>
        <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Подключенные услуги
        </h2>
        <div
          v-if="subscriptions.length"
          class="grid gap-4"
        >
          <UCard
            v-for="sub in subscriptions"
            :key="sub.id"
            class="p-0 overflow-hidden"
          >
            <div class="flex items-start gap-4 p-5">
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                <Icon
                  :name="getServiceIcon(sub.service)"
                  class="w-6 h-6 text-primary"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="font-semibold text-[var(--text-primary)]">
                      {{ sub.service?.name || 'Услуга' }}
                    </h3>
                    <p class="text-sm text-[var(--text-muted)] mt-0.5">
                      {{ sub.service?.description || '' }}
                    </p>
                  </div>
                  <UBadge :class="getStatusColor(sub.status)">
                    {{ subscriptionStatusLabels[sub.status] }}
                  </UBadge>
                </div>
                <div class="flex items-center justify-between mt-4">
                  <span class="text-lg font-bold text-[var(--text-primary)]">
                    {{ formatPrice(getSubscriptionPrice(sub)) }}
                    <span class="text-sm font-normal text-[var(--text-muted)]">руб/мес</span>
                  </span>
                  <button class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          </UCard>
        </div>
        <UCard
          v-else
          padding="lg"
        >
          <div class="text-center py-4">
            <Icon
              name="heroicons:cube"
              class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4"
            />
            <p class="text-[var(--text-muted)]">
              Нет подключенных услуг
            </p>
          </div>
        </UCard>
      </section>

      <!-- Available Services -->
      <section v-if="availableServices.length">
        <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Доступные услуги
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <UCard
            v-for="service in availableServices"
            :key="service.id"
            class="p-0 overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div class="p-5">
              <div class="flex items-start gap-4">
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style="background: var(--glass-bg);"
                >
                  <Icon
                    :name="service.icon || 'heroicons:cube'"
                    class="w-5 h-5 text-[var(--text-muted)]"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-[var(--text-primary)]">
                    {{ service.name }}
                  </h3>
                  <p class="text-sm text-[var(--text-muted)] mt-0.5">
                    {{ service.description }}
                  </p>
                </div>
              </div>
              <div
                class="flex items-center justify-between mt-4 pt-4"
                style="border-top: 1px solid var(--glass-border);"
              >
                <span class="font-semibold text-[var(--text-primary)]">
                  {{ formatPrice(service.priceMonthly) }}
                  <span class="text-sm font-normal text-[var(--text-muted)]">руб/мес</span>
                </span>
                <UButton
                  size="sm"
                  variant="secondary"
                  :loading="connectingServiceId === service.id"
                  @click.stop="requestConnection(service)"
                >
                  {{ connectingServiceId === service.id ? 'Отправка...' : 'Подключить' }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </template>
  </div>
</template>
