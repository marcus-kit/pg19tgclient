<script setup lang="ts">
const actions = [
  {
    name: 'Оплатить',
    description: 'Пополнить баланс',
    icon: 'heroicons:credit-card',
    href: '/lk/payment',
    color: 'primary'
  },
  {
    name: 'Счета',
    description: 'История счетов',
    icon: 'heroicons:document-text',
    href: '/lk/invoices',
    color: 'info'
  },
  {
    name: 'Профиль',
    description: 'Мои данные',
    icon: 'heroicons:user',
    href: '/lk/profile',
    color: 'secondary'
  },
  {
    name: 'Поддержка',
    description: 'Связаться с нами',
    icon: 'heroicons:chat-bubble-left-right',
    href: '/lk/support',
    color: 'accent'
  }
]

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/20 text-primary',
  secondary: 'bg-secondary/20 text-secondary',
  accent: 'bg-accent/20 text-accent',
  info: 'bg-info/20 text-blue-400'
}
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Быстрые действия</h2>
    <div class="grid grid-cols-2 gap-3">
      <NuxtLink
        v-for="action in actions"
        :key="action.name"
        :to="action.href"
        class="group"
      >
        <UCard hover padding="sm">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 transition-transform group-hover:scale-110" :class="colorClasses[action.color]">
              <Icon :name="action.icon" class="w-5 h-5" />
            </div>
            <div>
              <p class="font-medium text-[var(--text-primary)] text-sm">{{ action.name }}</p>
              <p class="text-xs text-[var(--text-muted)]">{{ action.description }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>
