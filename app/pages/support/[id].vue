<script setup lang="ts">
import type { TicketDetail, TicketComment } from '~/types/ticket'
import { ticketStatusLabels, ticketStatusColors, ticketCategoryLabels, ticketCategoryIcons } from '~/types/ticket'

definePageMeta({
  layout: 'twa'
})

const route = useRoute()
const router = useRouter()
const ticketId = route.params.id as string

const { fetchTicket, addComment, closeTicket } = useTickets()
const { ticket, pending, error, refresh } = await fetchTicket(ticketId)

// Форма ответа
const replyContent = ref('')
const submitting = ref(false)

// Закрытие тикета
const showCloseModal = ref(false)
const closeStatus = ref<'resolved' | 'closed'>('resolved')
const closing = ref(false)

// Статусы для UI
const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral'; color: string }> = {
  new: { label: 'Новый', variant: 'info', color: 'text-blue-400' },
  open: { label: 'В работе', variant: 'warning', color: 'text-yellow-400' },
  pending: { label: 'Ожидает ответа', variant: 'warning', color: 'text-orange-400' },
  resolved: { label: 'Решён', variant: 'success', color: 'text-accent' },
  closed: { label: 'Закрыт', variant: 'neutral', color: 'text-[var(--text-muted)]' }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const submitReply = async () => {
  if (!replyContent.value.trim() || !ticket.value) return

  submitting.value = true
  try {
    const { comment, error: submitError } = await addComment(ticket.value.id, replyContent.value)

    if (submitError) {
      console.error('Error adding comment:', submitError)
      return
    }

    // Очищаем форму и обновляем тикет
    replyContent.value = ''
    await refresh()
  } finally {
    submitting.value = false
  }
}

// Можно ли отвечать (не закрыт и не решён)
const canReply = computed(() => {
  if (!ticket.value) return false
  return !['closed', 'resolved'].includes(ticket.value.status)
})

// Можно ли закрыть тикет
const canClose = computed(() => {
  if (!ticket.value) return false
  return !['closed', 'resolved'].includes(ticket.value.status)
})

// Открыть модалку закрытия
const openCloseModal = (status: 'resolved' | 'closed') => {
  closeStatus.value = status
  showCloseModal.value = true
}

// Закрыть тикет
const handleClose = async () => {
  if (!ticket.value || closing.value) return

  closing.value = true
  try {
    const { success, error: closeError } = await closeTicket(ticket.value.id, closeStatus.value)

    if (closeError) {
      console.error('Error closing ticket:', closeError)
      return
    }

    if (success) {
      showCloseModal.value = false
      await refresh()
    }
  } finally {
    closing.value = false
  }
}

// Scroll to bottom on mount
onMounted(() => {
  nextTick(() => {
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  })
})

useHead({
  title: computed(() => ticket.value ? `${ticket.value.number} — Поддержка` : 'Загрузка...')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <button
      @click="router.push('/support')"
      class="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
    >
      <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      Назад к заявкам
    </button>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <UCard class="animate-pulse">
        <div class="space-y-4">
          <div class="h-6 bg-[var(--glass-bg)] rounded w-1/4"></div>
          <div class="h-4 bg-[var(--glass-bg)] rounded w-3/4"></div>
          <div class="h-4 bg-[var(--glass-bg)] rounded w-1/2"></div>
        </div>
      </UCard>
    </div>

    <!-- Error -->
    <UCard v-else-if="error" class="border-red-500/30">
      <div class="text-center py-8">
        <Icon name="heroicons:exclamation-triangle" class="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Заявка не найдена</h3>
        <p class="text-[var(--text-muted)] mb-4">Возможно, она была удалена или у вас нет доступа</p>
        <UButton @click="router.push('/support')">Вернуться к заявкам</UButton>
      </div>
    </UCard>

    <!-- Ticket Content -->
    <template v-else-if="ticket">
      <!-- Header Card -->
      <UCard>
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
              <Icon
                :name="ticketCategoryIcons[ticket.category] || 'heroicons:ticket'"
                class="w-6 h-6 text-primary"
              />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-sm text-[var(--text-muted)]">{{ ticket.number }}</span>
                <UBadge :variant="statusConfig[ticket.status]?.variant || 'neutral'" size="sm">
                  {{ statusConfig[ticket.status]?.label || ticket.status }}
                </UBadge>
                <UBadge variant="neutral" size="sm">
                  {{ ticketCategoryLabels[ticket.category] || ticket.category }}
                </UBadge>
              </div>
              <h1 class="text-xl font-semibold text-[var(--text-primary)]">{{ ticket.subject }}</h1>
              <p class="text-sm text-[var(--text-muted)] mt-1">
                Создана {{ formatDate(ticket.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Кнопки закрытия -->
          <div v-if="canClose" class="flex gap-2 flex-shrink-0">
            <UButton
              variant="success"
              size="sm"
              @click="openCloseModal('resolved')"
            >
              <Icon name="heroicons:check" class="w-4 h-4 mr-1" />
              Решено
            </UButton>
            <UButton
              variant="secondary"
              size="sm"
              @click="openCloseModal('closed')"
            >
              <Icon name="heroicons:x-mark" class="w-4 h-4 mr-1" />
              Закрыть
            </UButton>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6 pt-6" style="border-top: 1px solid var(--glass-border);">
          <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ ticket.description }}</p>
        </div>
      </UCard>

      <!-- Messages -->
      <UCard v-if="ticket.comments?.length">
        <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Переписка
          <span class="text-sm text-[var(--text-muted)] font-normal ml-2">
            ({{ ticket.comments.length }})
          </span>
        </h2>

        <div id="messages-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <div
            v-for="comment in ticket.comments"
            :key="comment.id"
            class="flex gap-3"
            :class="comment.authorType === 'user' ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="comment.authorType === 'admin'
                ? 'bg-primary/20'
                : comment.authorType === 'system'
                  ? 'bg-[var(--glass-bg)]'
                  : 'bg-accent/20'"
            >
              <Icon
                :name="comment.authorType === 'admin'
                  ? 'heroicons:user-circle'
                  : comment.authorType === 'system'
                    ? 'heroicons:cog-6-tooth'
                    : 'heroicons:user'"
                class="w-5 h-5"
                :class="comment.authorType === 'admin'
                  ? 'text-primary'
                  : comment.authorType === 'system'
                    ? 'text-[var(--text-muted)]'
                    : 'text-accent'"
              />
            </div>

            <!-- Message -->
            <div
              class="flex-1 max-w-[80%] rounded-2xl px-4 py-3"
              :class="comment.authorType === 'user'
                ? 'bg-primary text-white rounded-tr-md'
                : comment.authorType === 'system'
                  ? 'bg-[var(--glass-bg)] text-[var(--text-muted)] text-center max-w-full text-sm'
                  : 'bg-[var(--glass-bg)] rounded-tl-md'"
            >
              <div v-if="comment.authorType !== 'system'" class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium" :class="comment.authorType === 'user' ? 'text-white/80' : 'text-[var(--text-muted)]'">
                  {{ comment.authorType === 'admin' ? (comment.authorName || 'Поддержка') : 'Вы' }}
                </span>
                <span class="text-xs" :class="comment.authorType === 'user' ? 'text-white/60' : 'text-[var(--text-muted)]'">
                  {{ formatRelativeDate(comment.createdAt) }}
                </span>
              </div>
              <p
                class="whitespace-pre-wrap"
                :class="comment.authorType === 'user' ? '' : 'text-[var(--text-primary)]'"
              >
                {{ comment.content }}
              </p>

              <!-- Solution badge -->
              <div v-if="comment.isSolution" class="mt-2 pt-2" style="border-top: 1px solid var(--glass-border);">
                <span class="inline-flex items-center gap-1 text-xs text-accent">
                  <Icon name="heroicons:check-badge" class="w-4 h-4" />
                  Решение
                </span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- No messages yet -->
      <UCard v-else class="text-center py-8">
        <Icon name="heroicons:chat-bubble-left-right" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">Пока нет ответов от поддержки</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Мы ответим в ближайшее время</p>
      </UCard>

      <!-- Reply Form -->
      <UCard v-if="canReply">
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Добавить сообщение</h3>
        <form @submit.prevent="submitReply" class="space-y-4">
          <textarea
            v-model="replyContent"
            rows="4"
            class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
            placeholder="Напишите сообщение..."
            required
          />
          <div class="flex justify-end">
            <UButton type="submit" :disabled="submitting || !replyContent.trim()">
              <Icon v-if="submitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4 mr-2" />
              {{ submitting ? 'Отправка...' : 'Отправить' }}
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Closed ticket notice -->
      <UCard v-else class="text-center py-6">
        <Icon name="heroicons:lock-closed" class="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
        <p class="text-[var(--text-muted)]">
          {{ ticket.status === 'resolved' ? 'Заявка решена' : 'Заявка закрыта' }}
        </p>
        <p class="text-sm text-[var(--text-muted)] mt-1">
          Создайте новую заявку, если у вас есть вопросы
        </p>
        <UButton class="mt-4" @click="router.push('/support')">
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Создать новую заявку
        </UButton>
      </UCard>
    </template>

    <!-- Модалка подтверждения закрытия -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showCloseModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background-color: var(--modal-backdrop);"
          @click.self="showCloseModal = false"
        >
          <div class="w-full max-w-md rounded-2xl p-6" style="background: var(--bg-surface); border: 1px solid var(--glass-border);">
            <div class="text-center mb-6">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                :class="closeStatus === 'resolved' ? 'bg-accent/20' : 'bg-[var(--glass-bg)]'"
              >
                <Icon
                  :name="closeStatus === 'resolved' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                  class="w-8 h-8"
                  :class="closeStatus === 'resolved' ? 'text-accent' : 'text-[var(--text-muted)]'"
                />
              </div>
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                {{ closeStatus === 'resolved' ? 'Отметить как решённую?' : 'Закрыть заявку?' }}
              </h3>
              <p class="text-sm text-[var(--text-muted)] mt-2">
                {{ closeStatus === 'resolved'
                  ? 'Подтвердите, что ваша проблема была решена. После этого вы не сможете добавлять сообщения.'
                  : 'Заявка будет закрыта. Если у вас появятся вопросы, создайте новую заявку.'
                }}
              </p>
            </div>

            <div class="flex gap-3">
              <UButton
                variant="secondary"
                class="flex-1"
                @click="showCloseModal = false"
                :disabled="closing"
              >
                Отмена
              </UButton>
              <UButton
                :variant="closeStatus === 'resolved' ? 'success' : 'primary'"
                class="flex-1"
                @click="handleClose"
                :disabled="closing"
              >
                <Icon v-if="closing" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ closing ? 'Закрытие...' : (closeStatus === 'resolved' ? 'Решено' : 'Закрыть') }}
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
