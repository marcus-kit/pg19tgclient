<script setup lang="ts">
interface TypingUser {
  name: string
  timestamp: number
  avatar?: string | null
}

const props = defineProps<{
  typingUsers: Map<string, TypingUser>
}>()

// Get initials for avatar fallback
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Random pastel color based on name (consistent for same name)
const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const typingUsersList = computed(() => {
  return Array.from(props.typingUsers.entries()).slice(0, 3).map(([id, data]) => ({
    id,
    ...data,
    initials: getInitials(data.name),
    color: getAvatarColor(data.name)
  }))
})

const typingText = computed(() => {
  const count = props.typingUsers.size
  if (count === 0) return ''
  if (count === 1) return 'печатает'
  return 'печатают'
})

const extraCount = computed(() => {
  return Math.max(0, props.typingUsers.size - 3)
})
</script>

<template>
  <Transition name="typing">
    <div
      v-if="typingUsers.size > 0"
      class="tg-typing-indicator"
    >
      <!-- Stacked avatars -->
      <div class="tg-typing-avatars">
        <div
          v-for="user in typingUsersList"
          :key="user.id"
          class="tg-typing-avatar"
          :style="{ backgroundColor: user.color }"
          :title="user.name"
        >
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.name"
            class="w-full h-full rounded-full object-cover"
          />
          <span v-else class="text-[10px] font-medium text-white">
            {{ user.initials }}
          </span>
        </div>
        <!-- Extra count badge -->
        <div
          v-if="extraCount > 0"
          class="tg-typing-avatar bg-gray-500"
        >
          <span class="text-[10px] font-medium text-white">+{{ extraCount }}</span>
        </div>
      </div>

      <!-- Animated dots -->
      <div class="tg-typing-dots">
        <span class="tg-typing-dot" />
        <span class="tg-typing-dot" />
        <span class="tg-typing-dot" />
      </div>

      <!-- Text -->
      <span class="text-sm text-[var(--text-muted)]">{{ typingText }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.tg-typing-avatar {
  @apply w-6 h-6 rounded-full flex items-center justify-center;
  @apply border-2 border-[var(--bg-base)] -ml-2;
}

.tg-typing-avatar:first-child {
  @apply ml-0;
}

.typing-enter-active,
.typing-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.typing-enter-from,
.typing-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
