<script setup lang="ts">
interface Props {
  show: boolean
  x: number
  y: number
  isOwn: boolean
  isPinned: boolean
  showModeration: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  reply: []
  report: []
  pin: []
  mute: []
  delete: []
}>()

// Закрыть при клике вне меню
function handleClickOutside() {
  emit('close')
}

// Закрыть при Escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

// Обработчики с автозакрытием
function handleReply() {
  emit('reply')
  emit('close')
}

function handleReport() {
  emit('report')
  emit('close')
}

function handlePin() {
  emit('pin')
  emit('close')
}

function handleMute() {
  emit('mute')
  emit('close')
}

function handleDelete() {
  emit('delete')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        :style="{ top: y + 'px', left: x + 'px' }"
        class="fixed z-50 bg-[var(--bg-surface)] border border-white/10 rounded-lg py-1 shadow-xl min-w-[160px]"
        @click.stop
      >
        <button
          @click="handleReply"
          class="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-[var(--text-primary)]"
        >
          <Icon name="heroicons:arrow-uturn-left" class="w-4 h-4" />
          Ответить
        </button>

        <button
          v-if="!isOwn"
          @click="handleReport"
          class="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-[var(--text-primary)]"
        >
          <Icon name="heroicons:flag" class="w-4 h-4" />
          Пожаловаться
        </button>

        <template v-if="showModeration">
          <hr class="border-white/10 my-1" />

          <button
            @click="handlePin"
            class="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-[var(--text-primary)]"
          >
            <Icon :name="isPinned ? 'heroicons:bookmark-slash' : 'heroicons:bookmark'" class="w-4 h-4" />
            {{ isPinned ? 'Открепить' : 'Закрепить' }}
          </button>

          <button
            v-if="!isOwn"
            @click="handleMute"
            class="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-[var(--text-primary)]"
          >
            <Icon name="heroicons:speaker-x-mark" class="w-4 h-4" />
            Замутить
          </button>

          <button
            @click="handleDelete"
            class="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-red-400"
          >
            <Icon name="heroicons:trash" class="w-4 h-4" />
            Удалить
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
