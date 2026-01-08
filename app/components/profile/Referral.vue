<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const referralLink = computed(() => {
  const code = authStore.referralProgram?.code || ''
  return `https://pg19.ru/ref/${code}`
})

const copySuccess = ref(false)

const copyCode = async () => {
  const code = authStore.referralProgram?.code
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = code
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    // Fallback
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const shareOptions = [
  { icon: 'simple-icons:telegram', label: 'Telegram', color: 'bg-[#26A5E4]' },
  { icon: 'simple-icons:whatsapp', label: 'WhatsApp', color: 'bg-[#25D366]' },
  { icon: 'simple-icons:vk', label: 'VK', color: 'bg-[#0077FF]' }
]
</script>

<template>
  <UCard class="lg:col-span-2">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">Пригласи друга</h2>
      <UBadge variant="success" size="sm">
        +300 ₽ за друга
      </UBadge>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Left: Code & Stats -->
      <div>
        <!-- Referral Code -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 mb-4">
          <p class="text-sm text-[var(--text-muted)] mb-2">Ваш промокод</p>
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-[var(--text-primary)] tracking-wider">
              {{ authStore.referralProgram?.code }}
            </span>
            <button
              class="p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
              style="background: var(--glass-bg);"
              @click="copyCode"
            >
              <Icon
                :name="copySuccess ? 'heroicons:check' : 'heroicons:clipboard-document'"
                :class="['w-5 h-5', copySuccess ? 'text-accent' : 'text-[var(--text-primary)]']"
              />
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="p-4 rounded-xl" style="background: var(--glass-bg);">
            <p class="text-2xl font-bold text-[var(--text-primary)]">{{ authStore.referralProgram?.totalInvited }}</p>
            <p class="text-sm text-[var(--text-muted)]">Приглашено</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--glass-bg);">
            <p class="text-2xl font-bold text-accent">{{ authStore.referralProgram?.totalBonus }} ₽</p>
            <p class="text-sm text-[var(--text-muted)]">Заработано</p>
          </div>
        </div>

        <!-- Share Buttons -->
        <div>
          <p class="text-sm text-[var(--text-muted)] mb-3">Поделиться</p>
          <div class="flex gap-2">
            <button
              v-for="option in shareOptions"
              :key="option.label"
              :class="[
                'flex-1 p-3 rounded-xl transition-all hover:scale-105',
                option.color
              ]"
            >
              <Icon :name="option.icon" class="w-5 h-5 text-white mx-auto" />
            </button>
            <button
              class="flex-1 p-3 rounded-xl hover:opacity-80 transition-colors"
              style="background: var(--glass-bg);"
              @click="copyLink"
            >
              <Icon name="heroicons:link" class="w-5 h-5 text-[var(--text-primary)] mx-auto" />
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Referrals List -->
      <div>
        <p class="text-sm text-[var(--text-muted)] mb-3">Ваши друзья</p>

        <div v-if="authStore.referralProgram?.referrals?.length" class="space-y-2">
          <div
            v-for="referral in authStore.referralProgram.referrals"
            :key="referral.id"
            class="flex items-center justify-between p-3 rounded-xl"
            style="background: var(--glass-bg);"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span class="text-sm font-bold text-white">
                  {{ referral.name.charAt(0) }}
                </span>
              </div>
              <div>
                <p class="text-[var(--text-primary)] font-medium">{{ referral.name }}</p>
                <p class="text-xs text-[var(--text-muted)]">{{ formatDate(referral.registeredAt) }}</p>
              </div>
            </div>
            <span class="text-accent font-medium">+{{ referral.bonus }} ₽</span>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <Icon name="heroicons:users" class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p class="text-[var(--text-muted)]">Пока нет приглашённых друзей</p>
          <p class="text-sm text-[var(--text-muted)] mt-1">Поделитесь промокодом и получите 300 ₽</p>
        </div>

        <!-- How it works -->
        <div class="mt-4 p-4 rounded-xl" style="background: var(--glass-bg);">
          <p class="text-sm font-medium text-[var(--text-primary)] mb-2">Как это работает?</p>
          <ol class="text-xs text-[var(--text-muted)] space-y-1">
            <li>1. Поделитесь промокодом с другом</li>
            <li>2. Друг подключается с вашим кодом</li>
            <li>3. Вы оба получаете по 300 ₽ на счёт</li>
          </ol>
        </div>
      </div>
    </div>
  </UCard>
</template>
