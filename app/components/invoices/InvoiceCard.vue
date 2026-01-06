<script setup lang="ts">
interface Invoice {
  id: number
  number: string
  amount: number
  status: 'issued' | 'paid' | 'overdue'
  period: string
  issuedAt: string
  dueDate: string
  paidAt?: string
}

const props = defineProps<{
  invoice: Invoice
}>()

const statusConfig = {
  issued: { label: 'Выставлен', variant: 'warning' as const },
  paid: { label: 'Оплачен', variant: 'success' as const },
  overdue: { label: 'Просрочен', variant: 'danger' as const }
}

const formatMoney = (kopeks: number) => {
  const rubles = kopeks / 100
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(rubles)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <UCard hover>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Invoice Info -->
      <div class="flex items-start gap-4">
        <div class="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
          <Icon
            :name="invoice.status === 'paid' ? 'heroicons:check-circle' : 'heroicons:document-text'"
            class="w-6 h-6"
            :class="invoice.status === 'paid' ? 'text-accent' : 'text-primary'"
          />
        </div>
        <div>
          <p class="font-semibold text-[var(--text-primary)]">{{ invoice.number }}</p>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ invoice.period }}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span>Выставлен: {{ formatDate(invoice.issuedAt) }}</span>
            <span v-if="invoice.status !== 'paid'">&middot; До: {{ formatDate(invoice.dueDate) }}</span>
            <span v-else>&middot; Оплачен: {{ formatDate(invoice.paidAt!) }}</span>
          </div>
        </div>
      </div>

      <!-- Amount & Status -->
      <div class="flex items-center justify-between sm:flex-col sm:items-end gap-2">
        <p class="text-xl font-bold text-[var(--text-primary)]">{{ formatMoney(invoice.amount) }}</p>
        <UBadge :variant="statusConfig[invoice.status].variant">
          {{ statusConfig[invoice.status].label }}
        </UBadge>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="invoice.status !== 'paid'" class="mt-4 pt-4 flex gap-3" style="border-top: 1px solid var(--glass-border);">
      <UButton variant="primary" size="sm">
        <Icon name="heroicons:credit-card" class="w-4 h-4" />
        Оплатить
      </UButton>
      <UButton variant="ghost" size="sm">
        <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
        Скачать PDF
      </UButton>
    </div>
  </UCard>
</template>
