<script setup lang="ts">
const emit = defineEmits<{
  submit: [data: { name: string; contact?: string }]
}>()

const name = ref('')
const contact = ref('')
const error = ref('')

function submit() {
  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Укажите имя'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    contact: contact.value.trim() || undefined
  })
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6">
    <div class="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
      <Icon name="heroicons:user-plus" class="w-8 h-8 text-primary" />
    </div>

    <h3 class="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">
      Начать чат
    </h3>
    <p class="text-sm text-[var(--text-muted)] text-center mb-6">
      Представьтесь, чтобы начать общение
    </p>

    <form @submit.prevent="submit" class="w-full space-y-4">
      <div>
        <input
          v-model="name"
          type="text"
          placeholder="Ваше имя *"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div>
        <input
          v-model="contact"
          type="text"
          placeholder="Телефон или email (необязательно)"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

      <button
        type="submit"
        class="w-full btn-primary py-3"
      >
        Начать чат
      </button>
    </form>
  </div>
</template>
