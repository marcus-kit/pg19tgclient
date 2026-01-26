<script setup lang="ts">
import type { Ticket, TicketCategory } from '~/types/ticket'
import { ticketStatusLabels, ticketStatusColors, ticketCategoryLabels } from '~/types/ticket'
import type { FaqItem } from '~/server/api/faq.get'

definePageMeta({
  layout: 'twa'
})

const router = useRouter()
const { fetchTickets, createTicket } = useTickets()
const { fetchFaq } = useFaq()

// Загружаем данные (lazy - не блокирует навигацию)
const { tickets, pending: ticketsPending, error: ticketsError, refresh: refreshTickets } = fetchTickets()
const { faq, pending: faqPending } = fetchFaq()

const activeTab = ref<'tickets' | 'faq'>('tickets')

// Статусы для UI
const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral'; color: string }> = {
  new: { label: 'Новая', variant: 'info', color: 'text-blue-400' },
  open: { label: 'В работе', variant: 'warning', color: 'text-yellow-400' },
  pending: { label: 'Ожидает ответа', variant: 'warning', color: 'text-orange-400' },
  resolved: { label: 'Решена', variant: 'success', color: 'text-accent' },
  closed: { label: 'Закрыта', variant: 'neutral', color: 'text-[var(--text-muted)]' }
}

const expandedFaq = ref<number | null>(null)

const toggleFaq = (id: number) => {
  expandedFaq.value = expandedFaq.value === id ? null : id
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

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Количество активных тикетов
const activeTicketsCount = computed(() => {
  return tickets.value.filter(t => t.status !== 'closed').length
})

// New ticket modal
const showNewTicketModal = ref(false)
const submitting = ref(false)
const newTicket = ref({
  category: '' as TicketCategory | '',
  subject: '',
  description: ''
})

const categories = [
  { value: 'technical', label: 'Техническая проблема' },
  { value: 'billing', label: 'Вопрос по оплате' },
  { value: 'tariff', label: 'Смена тарифа' },
  { value: 'connection', label: 'Подключение' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'other', label: 'Другое' }
]

const openTicket = (ticketId: string) => {
  navigateTo(`/support/${ticketId}`)
}

const submitTicket = async () => {
  if (!newTicket.value.subject.trim() || !newTicket.value.description.trim()) return

  submitting.value = true
  try {
    const { ticket, error } = await createTicket({
      subject: newTicket.value.subject,
      description: newTicket.value.description,
      category: (newTicket.value.category || 'other') as TicketCategory
    })

    if (error) {
      console.error('Error creating ticket:', error)
      return
    }

    // Закрываем модалку и очищаем форму
    showNewTicketModal.value = false
    newTicket.value = { category: '', subject: '', description: '' }

    // Редирект на страницу созданного тикета
    if (ticket) {
      router.push(`/support/${ticket.id}`)
    }
  } finally {
    submitting.value = false
  }
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
        <span v-if="activeTicketsCount" class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
          {{ activeTicketsCount }}
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
      <!-- Loading -->
      <div v-if="ticketsPending" class="space-y-3">
        <UCard v-for="i in 3" :key="i" class="animate-pulse">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-[var(--glass-bg)]"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-[var(--glass-bg)] rounded w-1/4"></div>
              <div class="h-4 bg-[var(--glass-bg)] rounded w-2/3"></div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Error -->
      <UCard v-else-if="ticketsError" class="border-red-500/30">
        <div class="text-center py-4">
          <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p class="text-red-400 mb-4">Ошибка загрузки заявок</p>
          <UButton @click="refreshTickets">Повторить</UButton>
        </div>
      </UCard>

      <!-- Tickets List -->
      <div v-else-if="tickets.length" class="space-y-3">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="glass-card rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition-colors"
          @click="openTicket(ticket.id)"
        >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
                <Icon
                  :name="ticket.status === 'resolved' ? 'heroicons:check-circle' : 'heroicons:chat-bubble-left-right'"
                  class="w-6 h-6"
                  :class="statusConfig[ticket.status]?.color || 'text-primary'"
                />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-[var(--text-muted)]">{{ ticket.number }}</span>
                  <UBadge :variant="statusConfig[ticket.status]?.variant || 'neutral'" size="sm">
                    {{ statusConfig[ticket.status]?.label || ticket.status }}
                  </UBadge>
                </div>
                <p class="font-medium text-[var(--text-primary)]">{{ ticket.subject }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                    {{ formatRelativeDate(ticket.updatedAt) }}
                  </span>
                  <span v-if="ticket.commentsCount" class="flex items-center gap-1">
                    <Icon name="heroicons:chat-bubble-left" class="w-3.5 h-3.5" />
                    {{ ticket.commentsCount }} сообщ.
                  </span>
                </div>
              </div>
            </div>
            <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--text-muted)] hidden sm:block" />
            </div>
        </div>
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
      <!-- Loading -->
      <div v-if="faqPending" class="space-y-3">
        <UCard v-for="i in 5" :key="i" class="animate-pulse p-5">
          <div class="h-5 bg-[var(--glass-bg)] rounded w-3/4"></div>
        </UCard>
      </div>

      <!-- FAQ List -->
      <template v-else>
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
      </template>
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
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background-color: var(--modal-backdrop);"
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
              <USelect
                v-model="newTicket.category"
                :options="categories"
                label="Категория"
                placeholder="Выберите категорию"
              />

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
                  v-model="newTicket.description"
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
                <UButton type="submit" variant="primary" class="flex-1" :disabled="submitting">
                  <Icon v-if="submitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                  <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4 mr-2" />
                  {{ submitting ? 'Отправка...' : 'Отправить' }}
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
