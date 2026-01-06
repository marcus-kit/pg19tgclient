<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const initials = computed(() => {
  if (!authStore.user) return ''
  const first = authStore.user.firstName?.charAt(0) || ''
  const last = authStore.user.lastName?.charAt(0) || ''
  return `${first}${last}`.toUpperCase()
})

const avatarGradient = computed(() => {
  // Generate consistent gradient based on user id
  const gradients = [
    'from-primary to-secondary',
    'from-blue-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600'
  ]
  const index = (authStore.user?.id || 0) % gradients.length
  return gradients[index]
})

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const handleAvatarClick = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file
  if (!file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите изображение')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Размер файла не должен превышать 5 МБ')
    return
  }

  isUploading.value = true

  // Convert to base64 and save to Supabase
  const reader = new FileReader()
  reader.onload = async (e) => {
    const result = e.target?.result as string
    const success = await authStore.updateUserData({ avatar: result })
    if (!success) {
      // Fallback to local storage only
      authStore.updateAvatar(result)
    }
    isUploading.value = false
  }
  reader.readAsDataURL(file)
}

const removeAvatar = async () => {
  isUploading.value = true
  const success = await authStore.updateUserData({ avatar: null })
  if (!success) {
    authStore.updateAvatar(null)
  }
  isUploading.value = false
}
</script>

<template>
  <UCard class="!p-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-semibold text-[var(--text-primary)]">Фото профиля</h2>
      <button
        v-if="authStore.user?.avatar"
        class="text-sm text-red-400 hover:text-red-300 transition-colors"
        @click="removeAvatar"
      >
        Удалить
      </button>
    </div>

    <div class="flex items-center gap-4">
      <!-- Avatar -->
      <div class="relative group">
        <button
          class="relative w-16 h-16 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          @click="handleAvatarClick"
        >
          <!-- Avatar Image or Initials -->
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.fullName"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            :class="['w-full h-full bg-gradient-to-br flex items-center justify-center', avatarGradient]"
          >
            <span class="text-xl font-bold text-white">{{ initials }}</span>
          </div>

          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Icon
              :name="isUploading ? 'heroicons:arrow-path' : 'heroicons:camera'"
              :class="['w-6 h-6 text-white', { 'animate-spin': isUploading }]"
            />
          </div>
        </button>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <!-- Info -->
      <div class="flex-1">
        <p class="text-[var(--text-primary)] font-medium text-sm">{{ authStore.fullName }}</p>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">
          Нажмите на фото для загрузки · JPG, PNG до 5 МБ
        </p>
      </div>
    </div>
  </UCard>
</template>
