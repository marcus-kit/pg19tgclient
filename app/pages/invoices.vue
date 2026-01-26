<script setup lang="ts">
import type { Invoice, InvoiceStatus } from '~/types/invoice'
import { invoiceStatusLabels, invoiceStatusColors, formatInvoicePeriod } from '~/types/invoice'

definePageMeta({
  layout: 'twa'
})

const { fetchInvoices } = useInvoices()

// Загружаем все счета (lazy - не блокирует навигацию)
const { invoices, pending, error, refresh } = fetchInvoices()

const filter = ref<'all' | 'unpaid' | 'paid'>('all')

const filteredInvoices = computed(() => {
  if (filter.value === 'unpaid') {
    return invoices.value.filter(inv => inv.status === 'issued' || inv.status === 'overdue')
  }
  if (filter.value === 'paid') {
    return invoices.value.filter(inv => inv.status === 'paid')
  }
  return invoices.value
})

const filters = [
  { value: 'all', label: 'Все' },
  { value: 'unpaid', label: 'К оплате' },
  { value: 'paid', label: 'Оплаченные' }
]

// Форматирование суммы
const formatAmount = (kopeks: number) => {
  return (kopeks / 100).toLocaleString('ru-RU')
}

// Форматирование даты
const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Цвет бейджа статуса
const getStatusBadgeClass = (status: InvoiceStatus) => {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-600/20 text-gray-400',
    primary: 'bg-primary/20 text-primary',
    green: 'bg-accent/20 text-accent',
    red: 'bg-red-500/20 text-red-400'
  }
  return colorMap[invoiceStatusColors[status]] || colorMap.gray
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Счета</h1>
        <p class="text-[var(--text-muted)] mt-1">История выставленных счетов</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2">
      <button
        v-for="f in filters"
        :key="f.value"
        @click="filter = f.value as any"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="filter === f.value
          ? 'bg-primary text-white'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        :style="filter !== f.value ? 'background: var(--glass-bg);' : ''"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-4">
      <UCard v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[var(--glass-bg)]"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-[var(--glass-bg)] rounded w-1/3"></div>
            <div class="h-3 bg-[var(--glass-bg)] rounded w-1/2"></div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error State -->
    <UCard v-else-if="error" class="border-red-500/30">
      <div class="text-center py-4">
        <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-400 mb-4">Ошибка загрузки счетов</p>
        <UButton @click="refresh">Повторить</UButton>
      </div>
    </UCard>

    <!-- Invoices List -->
    <div v-else class="space-y-4">
      <UCard
        v-for="invoice in filteredInvoices"
        :key="invoice.id"
        hover
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
              <Icon
                :name="invoice.status === 'paid' ? 'heroicons:check-circle' : 'heroicons:document-text'"
                class="w-6 h-6"
                :class="invoice.status === 'paid' ? 'text-accent' : 'text-primary'"
              />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-[var(--text-muted)]">{{ invoice.invoiceNumber }}</span>
                <UBadge :class="getStatusBadgeClass(invoice.status)" size="sm">
                  {{ invoiceStatusLabels[invoice.status] }}
                </UBadge>
              </div>
              <p class="font-medium text-[var(--text-primary)]">{{ formatInvoicePeriod(invoice) }}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                <span v-if="invoice.issuedAt">Выставлен: {{ formatDate(invoice.issuedAt) }}</span>
                <span v-if="invoice.paidAt">Оплачен: {{ formatDate(invoice.paidAt) }}</span>
                <span v-else-if="invoice.dueDate">Срок: {{ formatDate(invoice.dueDate) }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-lg font-bold text-[var(--text-primary)]">
              {{ formatAmount(invoice.amount) }}
              <span class="text-sm font-normal text-[var(--text-muted)]">₽</span>
            </span>
            <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--text-muted)] hidden sm:block" />
          </div>
        </div>
      </UCard>

      <!-- Empty State -->
      <UCard v-if="filteredInvoices.length === 0" padding="lg">
        <div class="text-center py-8">
          <Icon name="heroicons:document-text" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p class="text-[var(--text-muted)]">Счетов не найдено</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
