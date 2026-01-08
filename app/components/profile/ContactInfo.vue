<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Editing state
const isEditing = ref(false)
const isSaving = ref(false)
const editData = ref({
  phone: '',
  email: '',
  vkId: ''
})

const startEdit = () => {
  editData.value = {
    phone: authStore.user?.phone || '',
    email: authStore.user?.email || '',
    vkId: authStore.user?.vkId || ''
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveChanges = async () => {
  isSaving.value = true
  const success = await authStore.updateUserData({
    phone: editData.value.phone,
    email: editData.value.email,
    vkId: editData.value.vkId
  })
  isSaving.value = false
  if (success) {
    isEditing.value = false
  }
}

const contacts = computed(() => [
  {
    key: 'phone',
    label: 'Телефон',
    value: authStore.user?.phone,
    icon: 'heroicons:phone',
    verified: true,
    type: 'tel',
    placeholder: '+7 (999) 123-45-67',
    readonly: true // Нельзя редактировать
  },
  {
    key: 'email',
    label: 'Email',
    value: authStore.user?.email,
    icon: 'heroicons:envelope',
    verified: true,
    type: 'email',
    placeholder: 'example@mail.ru',
    readonly: false
  },
  {
    key: 'vkId',
    label: 'VK ID',
    value: authStore.user?.vkId,
    icon: 'simple-icons:vk',
    verified: false,
    type: 'text',
    placeholder: 'id123456789',
    readonly: false
  }
])
</script>

<template>
  <UCard class="!p-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-semibold text-[var(--text-primary)]">Контакты</h2>
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
    <div v-if="!isEditing" class="space-y-2">
      <div
        v-for="contact in contacts"
        :key="contact.key"
        class="flex items-center justify-between py-2 last:border-0"
        style="border-bottom: 1px solid var(--glass-border);"
      >
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
            <Icon :name="contact.icon" class="w-4 h-4 text-primary" />
          </div>
          <div>
            <p class="text-xs text-[var(--text-muted)]">{{ contact.label }}</p>
            <p class="text-sm text-[var(--text-primary)]">{{ contact.value || '—' }}</p>
          </div>
        </div>
        <UBadge v-if="contact.value && contact.verified" variant="success" size="sm">
          Подтверждён
        </UBadge>
        <UBadge v-else-if="contact.value" variant="neutral" size="sm">
          Не подтверждён
        </UBadge>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="space-y-3">
      <div v-for="contact in contacts" :key="contact.key">
        <label class="text-xs text-[var(--text-muted)] mb-1 block">{{ contact.label }}</label>
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
            <Icon :name="contact.icon" class="w-4 h-4 text-primary" />
          </div>
          <input
            v-if="contact.readonly"
            :value="contact.value || ''"
            :type="contact.type"
            readonly
            class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] cursor-not-allowed"
            title="Для изменения обратитесь в поддержку"
          />
          <input
            v-else
            v-model="editData[contact.key as keyof typeof editData]"
            :type="contact.type"
            class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            :placeholder="contact.placeholder"
          />
        </div>
      </div>
      <!-- Hint about readonly fields -->
      <div class="text-xs text-[var(--text-muted)] flex items-center gap-1 pt-1">
        <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
        Телефон можно изменить только через поддержку
      </div>
    </div>
  </UCard>
</template>
