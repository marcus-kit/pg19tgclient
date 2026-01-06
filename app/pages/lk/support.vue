<script setup lang="ts">
definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

const activeTab = ref<'tickets' | 'faq'>('tickets')

// Mock tickets data
const tickets = ref([
  {
    id: 1,
    number: 'TK-2024-0042',
    subject: 'Низкая скорость интернета',
    status: 'in_progress' as const,
    createdAt: '2024-01-05T10:30:00',
    updatedAt: '2024-01-05T14:15:00',
    messages: 3
  },
  {
    id: 2,
    number: 'TK-2024-0038',
    subject: 'Вопрос по тарифу',
    status: 'resolved' as const,
    createdAt: '2024-01-02T09:00:00',
    updatedAt: '2024-01-02T11:30:00',
    messages: 5
  },
  {
    id: 3,
    number: 'TK-2023-0156',
    subject: 'Перенос точки подключения',
    status: 'closed' as const,
    createdAt: '2023-12-15T16:45:00',
    updatedAt: '2023-12-18T10:00:00',
    messages: 8
  }
])

const statusConfig = {
  new: { label: 'Новая', variant: 'info' as const, color: 'text-blue-400' },
  in_progress: { label: 'В работе', variant: 'warning' as const, color: 'text-yellow-400' },
  resolved: { label: 'Решена', variant: 'success' as const, color: 'text-accent' },
  closed: { label: 'Закрыта', variant: 'neutral' as const, color: 'text-[var(--text-muted)]' }
}

const faq = [
  {
    id: 1,
    question: 'Как пополнить баланс?',
    answer: 'Пополнить баланс можно банковской картой в личном кабинете, через Сбербанк Онлайн по номеру договора, или наличными в офисе.'
  },
  {
    id: 2,
    question: 'Что делать, если интернет не работает?',
    answer: 'Проверьте баланс в личном кабинете. Перезагрузите роутер. Если проблема не решена - свяжитесь с поддержкой.'
  },
  {
    id: 3,
    question: 'Как сменить тариф?',
    answer: 'Смена тарифа доступна в разделе "Услуги". Новый тариф активируется с 1 числа следующего месяца.'
  },
  {
    id: 4,
    question: 'Как получить счет на оплату?',
    answer: 'Все счета доступны в разделе "Счета". Вы можете скачать PDF для оплаты через банк.'
  },
  {
    id: 5,
    question: 'Как подключить дополнительные услуги?',
    answer: 'Дополнительные услуги (ТВ, статический IP, антивирус) можно подключить в разделе "Услуги" или позвонив в поддержку.'
  }
]

const expandedFaq = ref<number | null>(null)

const toggleFaq = (id: number) => {
  expandedFaq.value = expandedFaq.value === id ? null : id
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7) return `${diffDays} дн. назад`

  return formatDate(dateString)
}

// New ticket modal
const showNewTicketModal = ref(false)
const newTicket = ref({
  category: '',
  subject: '',
  message: ''
})

const categories = [
  { value: 'technical', label: 'Техническая проблема' },
  { value: 'billing', label: 'Вопрос по оплате' },
  { value: 'tariff', label: 'Смена тарифа' },
  { value: 'other', label: 'Другое' }
]

const submitTicket = () => {
  // Mock submit
  const ticket = {
    id: tickets.value.length + 1,
    number: `TK-2024-${String(tickets.value.length + 43).padStart(4, '0')}`,
    subject: newTicket.value.subject,
    status: 'new' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: 1
  }
  tickets.value.unshift(ticket)
  showNewTicketModal.value = false
  newTicket.value = { category: '', subject: '', message: '' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Поддержка</h1>
        <p class="text-[var(--text-muted)] mt-1">Задайте вопрос или найдите ответ</p>
      </div>
      <UButton @click="showNewTicketModal = true">
        <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
        Создать заявку
      </UButton>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2">
      <button
        @click="activeTab = 'tickets'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'tickets'
          ? 'bg-primary text-white'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        :style="activeTab !== 'tickets' ? 'background: var(--glass-bg);' : ''"
      >
        <Icon name="heroicons:ticket" class="w-4 h-4 mr-2 inline-block" />
        Мои заявки
        <span v-if="tickets.filter(t => t.status !== 'closed').length" class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
          {{ tickets.filter(t => t.status !== 'closed').length }}
        </span>
      </button>
      <button
        @click="activeTab = 'faq'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'faq'
          ? 'bg-primary text-white'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        :style="activeTab !== 'faq' ? 'background: var(--glass-bg);' : ''"
      >
        <Icon name="heroicons:question-mark-circle" class="w-4 h-4 mr-2 inline-block" />
        Частые вопросы
      </button>
    </div>

    <!-- Tickets Tab -->
    <div v-if="activeTab === 'tickets'" class="space-y-4">
      <!-- Tickets List -->
      <div v-if="tickets.length" class="space-y-3">
        <UCard
          v-for="ticket in tickets"
          :key="ticket.id"
          hover
          class="cursor-pointer"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
                <Icon
                  :name="ticket.status === 'resolved' ? 'heroicons:check-circle' : 'heroicons:chat-bubble-left-right'"
                  class="w-6 h-6"
                  :class="statusConfig[ticket.status].color"
                />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-[var(--text-muted)]">{{ ticket.number }}</span>
                  <UBadge :variant="statusConfig[ticket.status].variant" size="sm">
                    {{ statusConfig[ticket.status].label }}
                  </UBadge>
                </div>
                <p class="font-medium text-[var(--text-primary)]">{{ ticket.subject }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                    {{ formatRelativeDate(ticket.updatedAt) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:chat-bubble-left" class="w-3.5 h-3.5" />
                    {{ ticket.messages }} сообщ.
                  </span>
                </div>
              </div>
            </div>
            <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--text-muted)] hidden sm:block" />
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <UCard v-else class="p-8">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="heroicons:inbox" class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Заявок пока нет</h3>
          <p class="text-[var(--text-muted)] mb-4">Создайте заявку, если у вас есть вопрос или проблема</p>
          <UButton @click="showNewTicketModal = true">
            <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
            Создать заявку
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- FAQ Tab -->
    <div v-if="activeTab === 'faq'" class="space-y-3">
      <UCard
        v-for="item in faq"
        :key="item.id"
        class="p-0 overflow-hidden cursor-pointer"
        @click="toggleFaq(item.id)"
      >
        <div class="p-5">
          <div class="flex items-center justify-between gap-4">
            <h3 class="font-medium text-[var(--text-primary)]">{{ item.question }}</h3>
            <Icon
              name="heroicons:chevron-down"
              class="w-5 h-5 text-[var(--text-muted)] transition-transform flex-shrink-0"
              :class="{ 'rotate-180': expandedFaq === item.id }"
            />
          </div>
          <div
            v-show="expandedFaq === item.id"
            class="mt-3 pt-3"
            style="border-top: 1px solid var(--glass-border);"
          >
            <p class="text-[var(--text-secondary)]">{{ item.answer }}</p>
          </div>
        </div>
      </UCard>

      <!-- Still have questions -->
      <UCard class="p-6 mt-6">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="heroicons:chat-bubble-left-right" class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Не нашли ответ?</h3>
          <p class="text-[var(--text-muted)] mb-4">Создайте заявку, и мы ответим в течение 15 минут</p>
          <UButton @click="showNewTicketModal = true; activeTab = 'tickets'">
            <Icon name="heroicons:pencil-square" class="w-5 h-5 mr-2" />
            Создать заявку
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- New Ticket Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showNewTicketModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          @click.self="showNewTicketModal = false"
        >
          <div class="w-full max-w-lg rounded-2xl p-6" style="background: var(--bg-surface); border: 1px solid var(--glass-border);">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">Новая заявка</h3>
              <button
                class="p-1 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                @click="showNewTicketModal = false"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <form class="space-y-4" @submit.prevent="submitTicket">
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Категория</label>
                <select
                  v-model="newTicket.category"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  required
                >
                  <option value="" disabled>Выберите категорию</option>
                  <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Тема</label>
                <input
                  v-model="newTicket.subject"
                  type="text"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  placeholder="Кратко опишите проблему"
                  required
                />
              </div>

              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Сообщение</label>
                <textarea
                  v-model="newTicket.message"
                  rows="4"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  placeholder="Подробно опишите вашу проблему или вопрос..."
                  required
                />
              </div>

              <div class="flex gap-3 pt-2">
                <UButton
                  type="button"
                  variant="secondary"
                  class="flex-1"
                  @click="showNewTicketModal = false"
                >
                  Отмена
                </UButton>
                <UButton type="submit" variant="primary" class="flex-1">
                  <Icon name="heroicons:paper-airplane" class="w-4 h-4 mr-2" />
                  Отправить
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
