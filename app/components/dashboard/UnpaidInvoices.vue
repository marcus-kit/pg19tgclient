<script setup lang="ts">
// Mock unpaid invoices
const unpaidInvoices = ref([
  {
    id: 1,
    number: 'СЧ-2024/00012',
    amount: 50000,
    period: 'Январь 2024',
    dueDate: '2024-01-31'
  }
])

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
    month: 'long'
  })
}
</script>

<template>
  <div v-if="unpaidInvoices.length > 0">
    <h2 class="text-lg font-semibold text-white mb-4">Неоплаченные счета</h2>
    <div class="space-y-3">
      <UCard v-for="invoice in unpaidInvoices" :key="invoice.id" hover padding="sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary/20">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="font-medium text-white text-sm">{{ invoice.number }}</p>
              <p class="text-xs text-gray-500">{{ invoice.period }} &middot; до {{ formatDate(invoice.dueDate) }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-white">{{ formatMoney(invoice.amount) }}</p>
            <UBadge variant="warning" size="sm">К оплате</UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
