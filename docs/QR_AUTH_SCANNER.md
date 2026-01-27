# QR-код авторизация: Сканер для Telegram Web App

## Обзор

Эта инструкция описывает реализацию сканера QR-кода для авторизации на веб-сайте pg19v3client через Telegram Mini App.

**Сценарий:**
1. Пользователь на веб-сайте (десктоп) открывает `/login` → выбирает вкладку "QR-код" → видит QR
2. Пользователь в TG App на телефоне нажимает "Сканировать QR" → сканирует код
3. TG App показывает детали устройства (IP, браузер) → пользователь нажимает "Подтвердить"
4. Веб-сайт автоматически авторизуется

## API Endpoints (уже реализованы в pg19v3client)

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/auth/qr/scan/{token}` | POST | Отправить после сканирования QR |
| `/api/auth/qr/confirm/{token}` | POST | Отправить при подтверждении входа |

**Body для обоих endpoints:**
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

## Формат QR-кода

QR содержит URL в формате: `pg19qr://{32-символьный токен}`

Пример: `pg19qr://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Реализация

### 1. Добавить QrScanner в useTwa.ts

```typescript
// app/composables/useTwa.ts
import {
  backButton,
  hapticFeedback,
  miniApp,
  initData,
  retrieveLaunchParams,
  useSignal,
  qrScanner  // Добавить импорт
} from '@tma.js/sdk-vue'

export function useTwa() {
  // ... существующий код ...

  // Добавить обёртку для QR сканера
  const qrScannerWrapper = {
    /**
     * Открывает встроенный QR сканер Telegram
     * @returns Promise<string> - содержимое QR-кода
     */
    open: (): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!qrScanner.open.isAvailable()) {
          reject(new Error('QR Scanner not available'))
          return
        }

        qrScanner.open({
          text: 'Наведите камеру на QR-код на экране компьютера',
          capture: (content) => {
            // Проверяем что это наш QR-код
            if (content.startsWith('pg19qr://')) {
              qrScanner.close()
              resolve(content)
              return true // Прекращаем сканирование
            }
            return false // Продолжаем сканирование
          }
        })
      })
    },

    close: () => {
      if (qrScanner.close.isAvailable()) {
        qrScanner.close()
      }
    },

    isAvailable: () => qrScanner.open.isAvailable()
  }

  return {
    // ... существующие exports ...
    qrScanner: qrScannerWrapper
  }
}
```

### 2. Создать composable useQrLogin.ts

```typescript
// app/composables/useQrLogin.ts

interface DeviceInfo {
  ip: string
  browser: string
  os: string
  userAgent: string
}

interface QrLoginState {
  status: 'idle' | 'scanning' | 'scanned' | 'confirming' | 'success' | 'error'
  token: string | null
  deviceInfo: DeviceInfo | null
  error: string | null
}

export function useQrLogin() {
  const { qrScanner, haptic, initData } = useTwa()

  const state = reactive<QrLoginState>({
    status: 'idle',
    token: null,
    deviceInfo: null,
    error: null
  })

  /**
   * Открывает сканер и обрабатывает QR-код
   */
  async function startScan(): Promise<void> {
    if (!qrScanner.isAvailable()) {
      state.error = 'QR сканер недоступен'
      state.status = 'error'
      return
    }

    state.status = 'scanning'
    state.error = null

    try {
      // Открываем сканер и ждём результат
      const qrContent = await qrScanner.open()

      // Парсим токен из QR
      const token = qrContent.replace('pg19qr://', '')

      if (token.length !== 32) {
        throw new Error('Неверный формат QR-кода')
      }

      state.token = token
      state.status = 'scanned'
      haptic.notificationOccurred('success')

      // Отправляем запрос на сервер
      const response = await $fetch<{ success: boolean; deviceInfo: DeviceInfo }>(
        `/api/auth/qr/scan/${token}`,
        {
          method: 'POST',
          body: { initData: initData.value }
        }
      )

      state.deviceInfo = response.deviceInfo

    } catch (e: any) {
      state.error = e.data?.message || e.message || 'Ошибка сканирования'
      state.status = 'error'
      haptic.notificationOccurred('error')
    }
  }

  /**
   * Подтверждает вход на веб-сайте
   */
  async function confirmLogin(): Promise<void> {
    if (!state.token) {
      state.error = 'Токен не найден'
      return
    }

    state.status = 'confirming'

    try {
      await $fetch(`/api/auth/qr/confirm/${state.token}`, {
        method: 'POST',
        body: { initData: initData.value }
      })

      state.status = 'success'
      haptic.notificationOccurred('success')

    } catch (e: any) {
      state.error = e.data?.message || e.message || 'Ошибка подтверждения'
      state.status = 'error'
      haptic.notificationOccurred('error')
    }
  }

  /**
   * Отменяет процесс
   */
  function cancel(): void {
    qrScanner.close()
    state.status = 'idle'
    state.token = null
    state.deviceInfo = null
    state.error = null
  }

  /**
   * Сбрасывает состояние
   */
  function reset(): void {
    cancel()
  }

  return {
    // State
    status: computed(() => state.status),
    token: computed(() => state.token),
    deviceInfo: computed(() => state.deviceInfo),
    error: computed(() => state.error),
    isAvailable: computed(() => qrScanner.isAvailable()),

    // Actions
    startScan,
    confirmLogin,
    cancel,
    reset
  }
}
```

### 3. Создать страницу сканирования (или модалку)

**Вариант A: Отдельная страница `/scan-qr`**

```vue
<!-- app/pages/scan-qr.vue -->
<script setup lang="ts">
/**
 * Страница сканирования QR-кода для авторизации на веб-сайте
 */
definePageMeta({
  layout: 'twa'
})

const { status, deviceInfo, error, isAvailable, startScan, confirmLogin, reset } = useQrLogin()
const router = useRouter()

// Кнопка "Назад" в TG
const { backButton } = useTwa()

onMounted(() => {
  backButton.show()
  backButton.onClick(() => {
    reset()
    router.back()
  })
})

onUnmounted(() => {
  backButton.hide()
})
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Вход на сайт</h1>

    <!-- Кнопка сканирования -->
    <template v-if="status === 'idle'">
      <p class="text-gray-500 mb-4">
        Отсканируйте QR-код на экране компьютера, чтобы войти в личный кабинет
      </p>

      <UButton
        v-if="isAvailable"
        block
        size="lg"
        @click="startScan"
      >
        <Icon name="heroicons:qr-code" class="w-5 h-5 mr-2" />
        Сканировать QR-код
      </UButton>

      <p v-else class="text-red-500">
        QR сканер недоступен в вашей версии Telegram
      </p>
    </template>

    <!-- Сканирование -->
    <template v-else-if="status === 'scanning'">
      <div class="text-center py-8">
        <div class="animate-pulse">
          <Icon name="heroicons:qr-code" class="w-16 h-16 mx-auto text-blue-500" />
        </div>
        <p class="mt-4 text-gray-500">Наведите камеру на QR-код...</p>
      </div>
    </template>

    <!-- QR отсканирован — подтверждение -->
    <template v-else-if="status === 'scanned' && deviceInfo">
      <div class="space-y-4">
        <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div class="flex items-center gap-2 text-green-500 mb-2">
            <Icon name="heroicons:check-circle" class="w-5 h-5" />
            <span class="font-medium">QR-код отсканирован</span>
          </div>
          <p class="text-sm text-gray-500">
            Подтвердите вход на устройстве:
          </p>
        </div>

        <!-- Информация об устройстве -->
        <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-500">IP адрес</span>
            <span class="font-mono">{{ deviceInfo.ip }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Браузер</span>
            <span>{{ deviceInfo.browser }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">ОС</span>
            <span>{{ deviceInfo.os }}</span>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="flex gap-3">
          <UButton
            variant="outline"
            class="flex-1"
            @click="reset"
          >
            Отмена
          </UButton>
          <UButton
            class="flex-1"
            @click="confirmLogin"
          >
            Подтвердить вход
          </UButton>
        </div>
      </div>
    </template>

    <!-- Подтверждение... -->
    <template v-else-if="status === 'confirming'">
      <div class="text-center py-8">
        <div class="animate-spin">
          <Icon name="heroicons:arrow-path" class="w-12 h-12 mx-auto text-blue-500" />
        </div>
        <p class="mt-4 text-gray-500">Подтверждаем вход...</p>
      </div>
    </template>

    <!-- Успех -->
    <template v-else-if="status === 'success'">
      <div class="text-center py-8">
        <Icon name="heroicons:check-circle" class="w-16 h-16 mx-auto text-green-500" />
        <p class="mt-4 text-lg font-medium">Вход выполнен!</p>
        <p class="text-gray-500">Теперь вы авторизованы на веб-сайте</p>

        <UButton
          class="mt-6"
          @click="router.push('/dashboard')"
        >
          Вернуться в приложение
        </UButton>
      </div>
    </template>

    <!-- Ошибка -->
    <template v-else-if="status === 'error'">
      <div class="text-center py-8">
        <Icon name="heroicons:x-circle" class="w-16 h-16 mx-auto text-red-500" />
        <p class="mt-4 text-lg font-medium">Ошибка</p>
        <p class="text-gray-500">{{ error }}</p>

        <UButton
          class="mt-6"
          @click="reset"
        >
          Попробовать снова
        </UButton>
      </div>
    </template>
  </div>
</template>
```

**Вариант B: Модалка в профиле**

Добавить кнопку в `app/pages/profile/index.vue`:

```vue
<!-- В секции настроек -->
<UButton
  variant="outline"
  block
  @click="navigateTo('/scan-qr')"
>
  <Icon name="heroicons:qr-code" class="w-5 h-5 mr-2" />
  Войти на сайте по QR
</UButton>
```

### 4. Добавить навигацию (опционально)

В `app/components/twa/TwaMobileNav.vue` можно добавить кнопку:

```vue
<NuxtLink
  to="/scan-qr"
  class="flex flex-col items-center gap-1 py-2 px-3"
>
  <Icon name="heroicons:qr-code" class="w-6 h-6" />
  <span class="text-xs">QR</span>
</NuxtLink>
```

## Тестирование

### Локальное тестирование (без Telegram)

Для тестирования без реального Telegram можно создать mock:

```typescript
// app/composables/useQrLogin.ts — добавить в начало для dev

if (import.meta.dev) {
  // Mock для локального тестирования
  const mockQrScanner = {
    open: () => new Promise(resolve => {
      const token = prompt('Введите токен из QR-кода:')
      resolve(`pg19qr://${token}`)
    }),
    close: () => {},
    isAvailable: () => true
  }
}
```

### Проверка flow

1. Открой https://pg19v3client.doka.team/login
2. Переключись на вкладку "QR-код"
3. Нажми "Показать QR-код"
4. В TG App открой страницу сканирования
5. Отсканируй QR-код
6. Подтверди вход
7. Веб-сайт должен автоматически авторизоваться

## Важные моменты

1. **initData обязателен** — без него API вернёт 401
2. **Токен живёт 5 минут** — после истечения нужно генерировать новый QR на веб-сайте
3. **Один токен = один вход** — после использования токен помечается как `used`
4. **Haptic feedback** — используй для UX (success/error)
5. **qrScanner.open() блокирует** — возвращает Promise, который резолвится при сканировании

## Зависимости

QrScanner уже включён в `@tma.js/sdk-vue` — дополнительные пакеты не нужны.

## Ссылки

- [@tma.js/sdk QrScanner docs](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/components/qr-scanner)
- [Telegram Mini Apps QR Scanner](https://core.telegram.org/bots/webapps#qr-scanner)
