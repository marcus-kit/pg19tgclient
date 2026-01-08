<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const showPasswordModal = ref(false)
const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Сейчас'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7) return `${diffDays} дн. назад`

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

const getDeviceIcon = (device: string) => {
  const lower = device.toLowerCase()
  if (lower.includes('iphone') || lower.includes('android') || lower.includes('phone')) {
    return 'heroicons:device-phone-mobile'
  }
  if (lower.includes('ipad') || lower.includes('tablet')) {
    return 'heroicons:device-tablet'
  }
  return 'heroicons:computer-desktop'
}

const handlePasswordChange = () => {
  // Validate
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    alert('Пароли не совпадают')
    return
  }
  if (passwordForm.value.new.length < 8) {
    alert('Пароль должен содержать минимум 8 символов')
    return
  }

  // TODO: Реализовать API для смены пароля
  // Пока показываем заглушку
  alert('Функция смены пароля в разработке')
  showPasswordModal.value = false
  passwordForm.value = { current: '', new: '', confirm: '' }
}

const terminateSession = (sessionId: string) => {
  if (confirm('Завершить сессию?')) {
    authStore.terminateSession(sessionId)
  }
}

const terminateAllSessions = () => {
  if (confirm('Завершить все сессии кроме текущей?')) {
    const currentSessionId = authStore.sessions.find(s => s.current)?.id
    authStore.sessions
      .filter(s => !s.current)
      .forEach(s => authStore.terminateSession(s.id))
  }
}
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold text-[var(--text-primary)]">Безопасность</h2>
    </div>

    <!-- Password Section -->
    <div class="mb-6 pb-6" style="border-bottom: 1px solid var(--glass-border);">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
            <Icon name="heroicons:key" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-[var(--text-primary)] font-medium">Пароль</p>
            <p class="text-sm text-[var(--text-muted)]">Последнее изменение: 3 месяца назад</p>
          </div>
        </div>
        <UButton size="sm" variant="secondary" @click="showPasswordModal = true">
          Изменить
        </UButton>
      </div>
    </div>

    <!-- Active Sessions -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-[var(--text-muted)]">Активные сессии</p>
        <button
          v-if="authStore.sessions.length > 1"
          class="text-xs text-red-400 hover:text-red-300 transition-colors"
          @click="terminateAllSessions"
        >
          Завершить все
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="session in authStore.sessions"
          :key="session.id"
          :class="[
            'p-3 rounded-xl',
            session.current ? 'bg-primary/10 border border-primary/30' : ''
          ]"
          :style="!session.current ? 'background: var(--glass-bg);' : ''"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div :class="[
                'p-2 rounded-xl',
                session.current ? 'bg-gradient-to-br from-primary/20 to-secondary/10' : ''
              ]" :style="!session.current ? 'background: var(--glass-bg);' : ''">
                <Icon
                  :name="getDeviceIcon(session.device)"
                  :class="['w-5 h-5', session.current ? 'text-primary' : 'text-[var(--text-muted)]']"
                />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-[var(--text-primary)] font-medium text-sm">{{ session.device }}</p>
                  <UBadge v-if="session.current" variant="success" size="sm">
                    Текущая
                  </UBadge>
                </div>
                <p class="text-xs text-[var(--text-muted)]">{{ session.browser }}</p>
                <p class="text-xs text-[var(--text-muted)] mt-1">
                  {{ session.location }} · {{ session.ip }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-[var(--text-muted)] mb-2">{{ formatDate(session.lastActive) }}</p>
              <button
                v-if="!session.current"
                class="text-xs text-red-400 hover:text-red-300 transition-colors"
                @click="terminateSession(session.id)"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showPasswordModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          @click.self="showPasswordModal = false"
        >
          <div class="w-full max-w-md rounded-2xl p-6" style="background: var(--bg-surface); border: 1px solid var(--glass-border);">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">Изменить пароль</h3>
              <button
                class="p-1 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                @click="showPasswordModal = false"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <form class="space-y-4" @submit.prevent="handlePasswordChange">
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Текущий пароль</label>
                <input
                  v-model="passwordForm.current"
                  type="password"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  placeholder="Введите текущий пароль"
                  required
                />
              </div>

              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Новый пароль</label>
                <input
                  v-model="passwordForm.new"
                  type="password"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  placeholder="Минимум 8 символов"
                  required
                />
              </div>

              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Подтвердите пароль</label>
                <input
                  v-model="passwordForm.confirm"
                  type="password"
                  class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                  placeholder="Повторите новый пароль"
                  required
                />
              </div>

              <div class="flex gap-3 pt-2">
                <UButton
                  type="button"
                  variant="secondary"
                  class="flex-1"
                  @click="showPasswordModal = false"
                >
                  Отмена
                </UButton>
                <UButton type="submit" variant="primary" class="flex-1">
                  Сохранить
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </UCard>
</template>
