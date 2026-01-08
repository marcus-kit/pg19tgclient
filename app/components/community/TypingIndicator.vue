<script setup lang="ts">
const props = defineProps<{
  typingUsers: Map<number, { name: string; timestamp: number }>
}>()

const typingText = computed(() => {
  const users = Array.from(props.typingUsers.values())
  if (users.length === 0) return ''
  if (users.length === 1) return `${users[0].name} печатает`
  if (users.length === 2) return `${users[0].name} и ${users[1].name} печатают`
  return `${users[0].name} и ещё ${users.length - 1} печатают`
})
</script>

<template>
  <Transition name="typing">
    <div
      v-if="typingUsers.size > 0"
      class="px-4 py-2 text-sm text-[var(--text-muted)] flex items-center gap-2"
    >
      <span class="typing-dots flex gap-0.5">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
      </span>
      <span>{{ typingText }}...</span>
    </div>
  </Transition>
</template>

<style scoped>
.typing-enter-active,
.typing-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.typing-enter-from,
.typing-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.typing-dots .dot {
  @apply w-1.5 h-1.5 rounded-full bg-[var(--text-muted)];
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
