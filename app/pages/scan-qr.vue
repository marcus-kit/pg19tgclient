<script setup lang="ts">
/**
 * Страница сканирования QR-кода для авторизации на веб-сайте
 *
 * Flow:
 * 1. Пользователь на сайте видит QR-код на /login
 * 2. В TG App открывает эту страницу, нажимает "Сканировать"
 * 3. После сканирования видит детали устройства
 * 4. Подтверждает вход → веб-сайт авторизуется
 */
definePageMeta({
  layout: 'twa',
})

const { status, deviceInfo, error, isAvailable, startScan, confirmLogin, reset } = useQrLogin()
const router = useRouter()

// Кнопка "Назад" в TG
const { backButton, haptic } = useTwa()

// Обработчик кнопки "Назад"
function handleBack() {
  reset()
  router.back()
}

onMounted(() => {
  backButton.show()
  backButton.onClick(handleBack)
})

onUnmounted(() => {
  backButton.hide()
  backButton.offClick(handleBack)
})

// Автоматически закрываем страницу после успеха через 2 секунды
watch(() => status.value, (newStatus) => {
  if (newStatus === 'success') {
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--tg-text-color,#fff)]">
        Вход на сайт
      </h1>
      <p class="text-[var(--tg-hint-color,#8b8b8b)] mt-1">
        Авторизация через QR-код
      </p>
    </div>

    <!-- Кнопка сканирования (idle) -->
    <template v-if="status === 'idle'">
      <div
        class="p-6 rounded-xl text-center"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <div
          class="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            opacity: 0.15,
          }"
        >
          <Icon
            name="heroicons:qr-code"
            class="w-10 h-10"
            :style="{ color: 'var(--tg-button-color, var(--primary))' }"
          />
        </div>

        <p class="text-[var(--tg-text-color,#fff)] mb-2">
          Войдите в личный кабинет на компьютере
        </p>
        <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)] mb-6">
          Откройте сайт на компьютере, выберите вход по QR-коду и отсканируйте его
        </p>

        <button
          v-if="isAvailable"
          class="w-full py-3 px-6 rounded-xl font-medium transition-colors"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            color: 'var(--tg-button-text-color, #fff)',
          }"
          @click="startScan"
        >
          <span class="flex items-center justify-center gap-2">
            <Icon
              name="heroicons:camera"
              class="w-5 h-5"
            />
            Сканировать QR-код
          </span>
        </button>

        <p
          v-else
          class="text-red-500 text-sm"
        >
          QR сканер недоступен в вашей версии Telegram
        </p>
      </div>

      <!-- Инструкция -->
      <div
        class="p-4 rounded-xl"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <p class="text-sm font-medium text-[var(--tg-text-color,#fff)] mb-3">
          Как это работает:
        </p>
        <ol class="space-y-2 text-sm text-[var(--tg-hint-color,#8b8b8b)]">
          <li class="flex gap-2">
            <span class="font-medium text-[var(--tg-button-color, var(--primary))]">1.</span>
            Откройте pg19v3client.doka.team/login на компьютере
          </li>
          <li class="flex gap-2">
            <span class="font-medium text-[var(--tg-button-color, var(--primary))]">2.</span>
            Выберите вкладку "QR-код"
          </li>
          <li class="flex gap-2">
            <span class="font-medium text-[var(--tg-button-color, var(--primary))]">3.</span>
            Нажмите кнопку выше и наведите камеру
          </li>
          <li class="flex gap-2">
            <span class="font-medium text-[var(--tg-button-color, var(--primary))]">4.</span>
            Подтвердите вход — готово!
          </li>
        </ol>
      </div>
    </template>

    <!-- Сканирование -->
    <template v-else-if="status === 'scanning'">
      <div
        class="p-8 rounded-xl text-center"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <div class="animate-pulse">
          <Icon
            name="heroicons:qr-code"
            class="w-16 h-16 mx-auto"
            :style="{ color: 'var(--tg-button-color, var(--primary))' }"
          />
        </div>
        <p class="mt-4 text-[var(--tg-hint-color,#8b8b8b)]">
          Наведите камеру на QR-код...
        </p>
      </div>
    </template>

    <!-- QR отсканирован — подтверждение -->
    <template v-else-if="status === 'scanned' && deviceInfo">
      <div class="space-y-4">
        <!-- Успех сканирования -->
        <div
          class="p-4 rounded-xl border"
          :style="{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.2)',
          }"
        >
          <div class="flex items-center gap-2 text-green-500 mb-2">
            <Icon
              name="heroicons:check-circle"
              class="w-5 h-5"
            />
            <span class="font-medium">QR-код отсканирован</span>
          </div>
          <p class="text-sm text-[var(--tg-hint-color,#8b8b8b)]">
            Подтвердите вход на устройстве:
          </p>
        </div>

        <!-- Информация об устройстве -->
        <div
          class="p-4 rounded-xl space-y-3"
          :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
        >
          <div class="flex justify-between items-center">
            <span class="text-[var(--tg-hint-color,#8b8b8b)]">IP адрес</span>
            <span class="font-mono text-[var(--tg-text-color,#fff)]">{{ deviceInfo.ip }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[var(--tg-hint-color,#8b8b8b)]">Браузер</span>
            <span class="text-[var(--tg-text-color,#fff)]">{{ deviceInfo.browser }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[var(--tg-hint-color,#8b8b8b)]">Операционная система</span>
            <span class="text-[var(--tg-text-color,#fff)]">{{ deviceInfo.os }}</span>
          </div>
        </div>

        <!-- Предупреждение -->
        <div
          class="p-3 rounded-lg flex items-start gap-2"
          :style="{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
          }"
        >
          <Icon
            name="heroicons:exclamation-triangle"
            class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
          />
          <p class="text-sm text-amber-500">
            Убедитесь, что это ваше устройство. Не подтверждайте вход, если не узнаёте браузер или IP.
          </p>
        </div>

        <!-- Кнопки -->
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 px-4 rounded-xl font-medium transition-colors border"
            :style="{
              backgroundColor: 'transparent',
              borderColor: 'var(--tg-hint-color, #8b8b8b)',
              color: 'var(--tg-text-color, #fff)',
            }"
            @click="reset"
          >
            Отмена
          </button>
          <button
            class="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
            :style="{
              backgroundColor: 'var(--tg-button-color, var(--primary))',
              color: 'var(--tg-button-text-color, #fff)',
            }"
            @click="confirmLogin"
          >
            Подтвердить вход
          </button>
        </div>
      </div>
    </template>

    <!-- Подтверждение... -->
    <template v-else-if="status === 'confirming'">
      <div
        class="p-8 rounded-xl text-center"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <div class="animate-spin">
          <Icon
            name="heroicons:arrow-path"
            class="w-12 h-12 mx-auto"
            :style="{ color: 'var(--tg-button-color, var(--primary))' }"
          />
        </div>
        <p class="mt-4 text-[var(--tg-hint-color,#8b8b8b)]">
          Подтверждаем вход...
        </p>
      </div>
    </template>

    <!-- Успех -->
    <template v-else-if="status === 'success'">
      <div
        class="p-8 rounded-xl text-center"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <div
          class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style="background: rgba(34, 197, 94, 0.2)"
        >
          <Icon
            name="heroicons:check-circle"
            class="w-10 h-10 text-green-500"
          />
        </div>
        <p class="text-lg font-medium text-[var(--tg-text-color,#fff)]">
          Вход выполнен!
        </p>
        <p class="text-[var(--tg-hint-color,#8b8b8b)] mt-1">
          Теперь вы авторизованы на веб-сайте
        </p>
      </div>
    </template>

    <!-- Ошибка -->
    <template v-else-if="status === 'error'">
      <div
        class="p-8 rounded-xl text-center"
        :style="{ backgroundColor: 'var(--tg-secondary-bg-color, var(--glass-bg))' }"
      >
        <div
          class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style="background: rgba(239, 68, 68, 0.2)"
        >
          <Icon
            name="heroicons:x-circle"
            class="w-10 h-10 text-red-500"
          />
        </div>
        <p class="text-lg font-medium text-[var(--tg-text-color,#fff)]">
          Ошибка
        </p>
        <p class="text-[var(--tg-hint-color,#8b8b8b)] mt-1">
          {{ error }}
        </p>

        <button
          class="mt-6 py-3 px-6 rounded-xl font-medium transition-colors"
          :style="{
            backgroundColor: 'var(--tg-button-color, var(--primary))',
            color: 'var(--tg-button-text-color, #fff)',
          }"
          @click="reset"
        >
          Попробовать снова
        </button>
      </div>
    </template>
  </div>
</template>
