<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Editing state
const isEditing = ref(false)
const isSaving = ref(false)
const editData = ref({
  lastName: '',
  firstName: '',
  middleName: '',
  birthDate: ''
})

const startEdit = () => {
  editData.value = {
    lastName: authStore.user?.lastName || '',
    firstName: authStore.user?.firstName || '',
    middleName: authStore.user?.middleName || '',
    birthDate: authStore.user?.birthDate || ''
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveChanges = async () => {
  isSaving.value = true
  const success = await authStore.updateUserData({
    lastName: editData.value.lastName,
    firstName: editData.value.firstName,
    middleName: editData.value.middleName,
    birthDate: editData.value.birthDate || null
  })
  isSaving.value = false
  if (success) {
    isEditing.value = false
  }
}

const formattedBirthDate = computed(() => {
  if (!authStore.user?.birthDate) return null
  return new Date(authStore.user.birthDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const age = computed(() => {
  if (!authStore.user?.birthDate) return null
  const birthDate = new Date(authStore.user.birthDate)
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years--
  }
  return years
})

const ageLabel = computed(() => {
  if (!age.value) return ''
  const lastDigit = age.value % 10
  const lastTwoDigits = age.value % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет'
  if (lastDigit === 1) return 'год'
  if (lastDigit >= 2 && lastDigit <= 4) return 'года'
  return 'лет'
})
</script>

<template>
  <UCard class="!p-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-semibold text-[var(--text-primary)]">Персональные данные</h2>
      <div v-if="!isEditing">
        <button
          class="text-sm text-primary hover:text-primary/80 transition-colors"
          @click="startEdit"
        >
          Редактировать
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <button
          class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          @click="cancelEdit"
          :disabled="isSaving"
        >
          Отмена
        </button>
        <button
          class="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          @click="saveChanges"
          :disabled="isSaving"
        >
          <Icon v-if="isSaving" name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>

    <!-- View Mode -->
    <div v-if="!isEditing" class="grid grid-cols-2 gap-x-4 gap-y-2">
      <div class="flex items-center gap-2 py-1.5" style="border-bottom: 1px solid var(--glass-border);">
        <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
          <Icon name="heroicons:user" class="w-4 h-4 text-primary" />
        </div>
        <div>
          <p class="text-xs text-[var(--text-muted)]">Фамилия</p>
          <p class="text-sm text-[var(--text-primary)]">{{ authStore.user?.lastName || '—' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 py-1.5" style="border-bottom: 1px solid var(--glass-border);">
        <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
          <Icon name="heroicons:user" class="w-4 h-4 text-primary" />
        </div>
        <div>
          <p class="text-xs text-[var(--text-muted)]">Имя</p>
          <p class="text-sm text-[var(--text-primary)]">{{ authStore.user?.firstName || '—' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 py-1.5">
        <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
          <Icon name="heroicons:user" class="w-4 h-4 text-primary" />
        </div>
        <div>
          <p class="text-xs text-[var(--text-muted)]">Отчество</p>
          <p class="text-sm text-[var(--text-primary)]">{{ authStore.user?.middleName || '—' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 py-1.5">
        <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
          <Icon name="heroicons:cake" class="w-4 h-4 text-primary" />
        </div>
        <div>
          <p class="text-xs text-[var(--text-muted)]">Дата рождения</p>
          <p class="text-sm text-[var(--text-primary)]">
            <template v-if="formattedBirthDate">
              {{ formattedBirthDate }}
              <span class="text-[var(--text-muted)] text-xs">({{ age }} {{ ageLabel }})</span>
            </template>
            <template v-else>—</template>
          </p>
        </div>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Фамилия</label>
        <input
          v-model="editData.lastName"
          type="text"
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Фамилия"
        />
      </div>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Имя</label>
        <input
          v-model="editData.firstName"
          type="text"
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Имя"
        />
      </div>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Отчество</label>
        <input
          v-model="editData.middleName"
          type="text"
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Отчество"
        />
      </div>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Дата рождения</label>
        <input
          v-model="editData.birthDate"
          type="date"
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  </UCard>
</template>
