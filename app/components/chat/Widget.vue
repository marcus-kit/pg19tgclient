<script setup lang="ts">
const chatStore = useChatStore()
const { unreadCount, isOpen, isMinimized } = storeToRefs(chatStore)

// Анимация пульсации при новых сообщениях
const isPulsing = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null

watch(unreadCount, (newVal, oldVal) => {
  if (newVal > oldVal) {
    // Очищаем предыдущий таймер если есть
    if (pulseTimer) clearTimeout(pulseTimer)

    isPulsing.value = true
    pulseTimer = setTimeout(() => {
      isPulsing.value = false
      pulseTimer = null
    }, 1000)
  }
})

// Очистка таймера при размонтировании
onUnmounted(() => {
  if (pulseTimer) {
    clearTimeout(pulseTimer)
    pulseTimer = null
  }
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- Кнопка чата -->
    <Transition name="scale">
      <button
        v-if="!isOpen || isMinimized"
        @click="chatStore.toggle()"
        class="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40"
        :class="{ 'animate-pulse': isPulsing }"
      >
        <Icon name="heroicons:chat-bubble-left-right" class="w-6 h-6" />

        <!-- Бейдж с непрочитанными -->
        <Transition name="scale">
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </Transition>
      </button>
    </Transition>

    <!-- Окно чата -->
    <Transition name="chat-window">
      <ChatWindow v-if="isOpen && !isMinimized" />
    </Transition>
  </div>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.chat-window-enter-active,
.chat-window-leave-active {
  transition: all 0.3s ease;
}

.chat-window-enter-from,
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
