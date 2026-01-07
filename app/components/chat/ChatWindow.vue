<script setup lang="ts">
const chatStore = useChatStore()
const authStore = useAuthStore()

const { session, messages, isLoading, isSending, error, initSession, sendMessage } = useChat()

const showGuestForm = ref(false)
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// Получить sessionId из localStorage (Pinia persist может не успеть hydrate)
function getPersistedSessionId(): number | null {
  if (import.meta.server) return null
  try {
    const stored = localStorage.getItem('chat')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.sessionId || null
    }
  } catch {
    // ignore
  }
  return null
}

// Инициализация сессии при монтировании
onMounted(async () => {
  // Читаем sessionId напрямую из localStorage (fallback для SSR hydration)
  const savedSessionId = chatStore.sessionId || getPersistedSessionId()

  // Если есть сохранённый sessionId - пробуем восстановить
  if (savedSessionId) {
    try {
      await initSession({
        chatId: savedSessionId,
        userId: authStore.user?.id
      })
      // Обновляем sessionId если сессия восстановлена
      if (session.value) {
        chatStore.setSessionId(session.value.id)
      }
    } catch {
      // Если сессия не найдена или закрыта - сбрасываем
      chatStore.sessionId = null
      chatStore.guestName = null
      localStorage.removeItem('chat')
      // Показываем форму гостя если не авторизован
      if (!authStore.isAuthenticated) {
        showGuestForm.value = true
      }
    }
  }

  // Если нет сохранённого sessionId и сессия не была восстановлена
  if (!savedSessionId && !session.value) {
    if (authStore.isAuthenticated) {
      // Авторизованный пользователь
      await initSession({ userId: authStore.user?.id })
      // Сохраняем sessionId для восстановления
      if (session.value) {
        chatStore.setSessionId(session.value.id)
      }
    } else {
      // Гость - показываем форму
      showGuestForm.value = true
    }
  }
})

// Автоскролл при новых сообщениях
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Инициализация для гостя
async function initGuestSession(data: { name: string; contact?: string }) {
  await initSession({
    guestName: data.name,
    guestContact: data.contact
  })
  chatStore.setGuestName(data.name)
  if (session.value) {
    chatStore.setSessionId(session.value.id)
  }
  showGuestForm.value = false
}

// Отправка сообщения
async function handleSend() {
  if (!messageText.value.trim() || isSending.value) return

  const text = messageText.value
  messageText.value = ''

  try {
    await sendMessage(text)
    // Сбрасываем счётчик непрочитанных
    chatStore.clearUnread()
  } catch {
    // Возвращаем текст обратно при ошибке
    messageText.value = text
  }
}

// Обработка Enter
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="w-[380px] h-[520px] glass-card rounded-2xl shadow-2xl flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
          <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 class="font-semibold text-[var(--text-primary)]">Поддержка ПЖ19</h3>
          <p class="text-xs text-[var(--text-muted)]">
            {{ session?.status === 'waiting' ? 'Ожидание оператора...' : 'Онлайн' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="chatStore.minimize()"
          class="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Свернуть"
        >
          <Icon name="heroicons:minus" class="w-5 h-5 text-[var(--text-muted)]" />
        </button>
        <button
          @click="chatStore.close()"
          class="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Закрыть"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Loading -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <!-- Guest Form -->
      <ChatGuestForm
        v-else-if="showGuestForm"
        @submit="initGuestSession"
      />

      <!-- Messages -->
      <template v-else>
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-3"
        >
          <!-- Welcome message -->
          <div v-if="messages.length === 0" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
              <Icon name="heroicons:sparkles" class="w-8 h-8 text-primary" />
            </div>
            <h4 class="font-semibold text-[var(--text-primary)] mb-2">Добро пожаловать!</h4>
            <p class="text-sm text-[var(--text-muted)]">
              Напишите ваш вопрос и наш оператор ответит вам
            </p>
          </div>

          <ChatMessage
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-white/10">
          <div v-if="error" class="text-red-400 text-sm mb-2">{{ error }}</div>

          <div class="flex items-end gap-2">
            <textarea
              v-model="messageText"
              @keydown="handleKeydown"
              placeholder="Напишите сообщение..."
              rows="1"
              class="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none max-h-32"
              :disabled="isSending"
            ></textarea>

            <button
              @click="handleSend"
              :disabled="!messageText.trim() || isSending"
              class="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
            >
              <Icon
                :name="isSending ? 'heroicons:arrow-path' : 'heroicons:paper-airplane'"
                class="w-5 h-5"
                :class="{ 'animate-spin': isSending }"
              />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
