<script setup lang="ts">
import { formatInvoicePeriod } from '~/types/invoice'

const { fetchUnpaidInvoices } = useInvoices()
const { invoices, pending } = await fetchUnpaidInvoices()

const formatMoney = (kopeks: number) => {
  const rubles = kopeks / 100
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(rubles)
}

const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  })
}
</script>

<template>
  <!-- Loading -->
  <div v-if="pending" class="mb-6">
    <div class="h-6 bg-[var(--glass-bg)] rounded w-40 mb-4"></div>
    <UCard class="animate-pulse">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-[var(--glass-bg)]"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-[var(--glass-bg)] rounded w-1/3"></div>
          <div class="h-3 bg-[var(--glass-bg)] rounded w-1/2"></div>
        </div>
      </div>
    </UCard>
  </div>

  <!-- Unpaid invoices -->
  <div v-else-if="invoices.length > 0" class="mb-6">
    <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Неоплаченные счета</h2>
    <div class="space-y-3">
      <UCard v-for="invoice in invoices" :key="invoice.id" hover padding="sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="font-medium text-[var(--text-primary)] text-sm">{{ invoice.invoiceNumber }}</p>
              <p class="text-xs text-[var(--text-muted)]">
                {{ formatInvoicePeriod(invoice) }}
                <template v-if="invoice.dueDate"> &middot; до {{ formatDate(invoice.dueDate) }}</template>
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-[var(--text-primary)]">{{ formatMoney(invoice.amount) }}</p>
            <UBadge :variant="invoice.status === 'overdue' ? 'error' : 'warning'" size="sm">
              {{ invoice.status === 'overdue' ? 'Просрочен' : 'К оплате' }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
