<script setup lang="ts">
definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

// Mock invoices data
const invoices = ref([
  {
    id: 1,
    number: 'СЧ-2024/00012',
    amount: 50000,
    status: 'issued' as const,
    period: 'Январь 2024',
    issuedAt: '2024-01-01',
    dueDate: '2024-01-31'
  },
  {
    id: 2,
    number: 'СЧ-2023/00011',
    amount: 50000,
    status: 'paid' as const,
    period: 'Декабрь 2023',
    issuedAt: '2023-12-01',
    dueDate: '2023-12-31',
    paidAt: '2023-12-15'
  },
  {
    id: 3,
    number: 'СЧ-2023/00010',
    amount: 50000,
    status: 'paid' as const,
    period: 'Ноябрь 2023',
    issuedAt: '2023-11-01',
    dueDate: '2023-11-30',
    paidAt: '2023-11-20'
  },
  {
    id: 4,
    number: 'СЧ-2023/00009',
    amount: 50000,
    status: 'paid' as const,
    period: 'Октябрь 2023',
    issuedAt: '2023-10-01',
    dueDate: '2023-10-31',
    paidAt: '2023-10-18'
  },
  {
    id: 5,
    number: 'СЧ-2023/00008',
    amount: 45000,
    status: 'paid' as const,
    period: 'Сентябрь 2023',
    issuedAt: '2023-09-01',
    dueDate: '2023-09-30',
    paidAt: '2023-09-22'
  }
])

const filter = ref<'all' | 'unpaid' | 'paid'>('all')

const filteredInvoices = computed(() => {
  if (filter.value === 'unpaid') {
    return invoices.value.filter(inv => inv.status !== 'paid')
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

    <!-- Invoices List -->
    <div class="space-y-4">
      <InvoicesInvoiceCard
        v-for="invoice in filteredInvoices"
        :key="invoice.id"
        :invoice="invoice"
      />

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
