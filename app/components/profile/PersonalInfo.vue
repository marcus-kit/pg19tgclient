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

function startEdit() {
  editData.value = {
    lastName: authStore.user?.lastName || '',
    firstName: authStore.user?.firstName || '',
    middleName: authStore.user?.middleName || '',
    birthDate: authStore.user?.birthDate || ''
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveChanges() {
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

// Nickname editing
const isEditingNickname = ref(false)
const isSavingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')

function startEditNickname() {
  nicknameInput.value = authStore.user?.nickname || ''
  nicknameError.value = ''
  isEditingNickname.value = true
}

function cancelEditNickname() {
  isEditingNickname.value = false
  nicknameError.value = ''
}

async function saveNickname() {
  const nickname = nicknameInput.value.trim() || null

  // Валидация
  if (nickname && (nickname.length < 2 || nickname.length > 30)) {
    nicknameError.value = 'Никнейм должен быть от 2 до 30 символов'
    return
  }

  isSavingNickname.value = true
  nicknameError.value = ''

  try {
    const response = await $fetch<{ success: boolean; nickname: string | null }>('/api/user/profile/nickname', {
      method: 'PATCH',
      body: { nickname }
    })

    if (response.success && authStore.user) {
      authStore.user.nickname = response.nickname
      authStore.persist()
      isEditingNickname.value = false
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    nicknameError.value = err.data?.message || 'Ошибка сохранения'
  } finally {
    isSavingNickname.value = false
  }
}
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

    <!-- Edit Mode (personal data) -->
    <div v-else class="grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Фамилия</label>
        <input
          :value="authStore.user?.lastName || ''"
          type="text"
          readonly
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-not-allowed"
          title="Для изменения обратитесь в поддержку"
        />
      </div>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Имя</label>
        <input
          :value="authStore.user?.firstName || ''"
          type="text"
          readonly
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-not-allowed"
          title="Для изменения обратитесь в поддержку"
        />
      </div>

      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1 block">Отчество</label>
        <input
          :value="authStore.user?.middleName || ''"
          type="text"
          readonly
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-not-allowed"
          title="Для изменения обратитесь в поддержку"
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

      <!-- Hint about readonly fields -->
      <div class="col-span-2 text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
        <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
        ФИО можно изменить только через поддержку
      </div>
    </div>

    <!-- Nickname Section (always visible) -->
    <div class="mt-4 pt-4" style="border-top: 1px solid var(--glass-border);">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
            <Icon name="heroicons:at-symbol" class="w-4 h-4 text-primary" />
          </div>
          <div>
            <p class="text-xs text-[var(--text-muted)]">Никнейм в чате</p>
            <p v-if="!isEditingNickname" class="text-sm text-[var(--text-primary)]">
              {{ authStore.user?.nickname || 'Не задан' }}
            </p>
          </div>
        </div>
        <button
          v-if="!isEditingNickname"
          class="text-xs text-primary hover:text-primary/80 transition-colors"
          @click="startEditNickname"
        >
          {{ authStore.user?.nickname ? 'Изменить' : 'Задать' }}
        </button>
      </div>

      <!-- Nickname Edit Form -->
      <div v-if="isEditingNickname" class="mt-2 space-y-2">
        <input
          v-model="nicknameInput"
          type="text"
          maxlength="30"
          class="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Введите никнейм (2-30 символов)"
          @keyup.enter="saveNickname"
        />
        <p v-if="nicknameError" class="text-xs text-red-500">{{ nicknameError }}</p>
        <p class="text-xs text-[var(--text-muted)]">
          Уникальное имя для отображения в чате вместо реального имени
        </p>
        <div class="flex items-center gap-2">
          <button
            class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            @click="cancelEditNickname"
            :disabled="isSavingNickname"
          >
            Отмена
          </button>
          <button
            class="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            @click="saveNickname"
            :disabled="isSavingNickname"
          >
            <Icon v-if="isSavingNickname" name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
            {{ isSavingNickname ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </UCard>
</template>
