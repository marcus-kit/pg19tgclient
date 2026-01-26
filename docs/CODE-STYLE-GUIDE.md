# Правила оформления кода Vue + Nuxt

## Best Practices — Чистый код. Основные правила: Минимализм, читаемость, никакого мусора!

### Пиши коротко и понятно

```typescript
// ❌ Плохо — слишком многословно
const isUserActive = computed(() => {
  if (user.value.status === 'active') {
    return true
  } else {
    return false
  }
})

// ✅ Хорошо — одна строка, тот же смысл
const isUserActive = computed(() => user.value.status === 'active')
```

### Называй так, чтобы было понятно без комментария

```typescript
// ❌ Плохо — непонятно что это
const d = users.filter(u => u.s === 'a')

// ✅ Хорошо — сразу ясно
const activeUsers = users.filter(user => user.status === 'active')
```

### Выходи из функции рано (guard clauses)

```typescript
// ❌ Плохо — много вложенности, трудно читать
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // основная логика глубоко внутри
      }
    }
  }
}

// ✅ Хорошо — проверки в начале, логика внизу
function processUser(user) {
  if (!user) return // Нет пользователя — выходим
  if (!user.isActive) return // Неактивен — выходим
  if (!user.hasPermission) return // Нет прав — выходим

  // Основная логика — легко читать
}
```

### Используй деструктуризацию

```typescript
// ❌ Плохо — повторяем props.user много раз
const userName = props.user.name
const userEmail = props.user.email
const userRole = props.user.role

// ✅ Хорошо — вытаскиваем всё сразу
const { name, email, role } = props.user
```

### Удаляй мёртвый код

```typescript
// ❌ Плохо — закомментированный код засоряет файл
// function oldImplementation() { ... }
// const unusedVariable = 'test'

// ✅ Хорошо — Git помнит историю, удаляй смело
```

### Один файл — одна задача

```typescript
// ❌ Плохо — всё свалено в один файл
// utils/helpers.ts — 500 строк всего подряд

// ✅ Хорошо — каждая функция в своём файле
// utils/formatDate.ts — форматирование даты
// utils/validateEmail.ts — проверка email
// utils/parseQuery.ts — парсинг URL параметров
```

---

## Комментарии

### Всегда комментируй на русском

```typescript
const users = ref<User[]>([]) // Список пользователей
const isLoading = ref(false) // Идёт ли загрузка
const error = ref<string | null>(null) // Текст ошибки (если есть)

// Загружаем пользователей с сервера
async function fetchUsers() {
  isLoading.value = true // Включаем индикатор загрузки
  try {
    const { data } = await supabase.from('users').select('*')
    users.value = data ?? [] // Сохраняем результат (или пустой массив)
  } catch (err) {
    error.value = 'Не удалось загрузить пользователей' // Сохраняем ошибку
  } finally {
    isLoading.value = false // Выключаем индикатор в любом случае
  }
}
```

## 1. Именование файлов

### Компоненты (Components)

**Компонент** — переиспользуемый блок интерфейса (кнопка, карточка, форма).

**Правила:**
- **PascalCase** — каждое слово с большой буквы: `UserProfile`, не `userProfile`
- **Минимум 2 слова** — избегаем конфликтов с HTML тегами (`<button>`, `<header>`)
- **Префиксы для базовых компонентов:**
  - `Ui` — базовые UI элементы: `UiButton`, `UiInput`, `UiModal`
  - `App` — компоненты уровня приложения: `AppHeader`, `AppFooter`
  - `The` — единственные на странице: `TheNavbar`, `TheSidebar`

### Composables (Композиции / Хуки)

**Composable** — переиспользуемая логика с реактивным состоянием.

**Правила:**
- **Префикс `use`** — обязателен, это соглашение Vue
- **camelCase** — `useAuth`, не `use-auth`
- **Глагол для действий** — `useCreatePost`, `useFetchData`, `useDeleteUser`

### Утилиты (Utils)

**Утилита** — чистая функция без состояния (форматирование, валидация).

**Правила:**
- **camelCase** — `formatDate.ts`
- **Глагол + существительное** — `formatDate`, `validateEmail`, `parseQuery`
- **Один файл = одна функция** (или группа тесно связанных)

---

## 2. Структура Vue компонента

Порядок секций в `.vue` файле и порядок кода внутри `<script setup>`.

### Порядок блоков в файле

```vue
<!-- 1. SCRIPT — всегда первый -->
<script setup lang="ts">
// Логика компонента
</script>

<!-- 2. TEMPLATE — второй -->
<template>
  <!-- Разметка -->
</template>

<!-- 3. STYLE — последний -->
<style scoped>
/* Стили */
</style>
```

### Порядок кода внутри `<script setup>`

```vue
<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// 1. ИМПОРТЫ ТИПОВ (Type Imports)
// ═══════════════════════════════════════════════════════════════════════════
// Импортируем только типы для TypeScript.
// Используем `import type` — это удаляется при сборке.

import type { User, UserRole } from '~/types'
import type { Database } from '~/types/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// 2. МАКРОСЫ ВРЕМЕНИ КОМПИЛЯЦИИ (Compile-time Macros)
// ═══════════════════════════════════════════════════════════════════════════
// Эти функции выполняются при СБОРКЕ, не в браузере.
// Nuxt использует их для генерации роутов, middleware и т.д.

// definePageMeta — настройки страницы (только в pages/*.vue)
definePageMeta({
  middleware: 'auth',       // Middleware для защиты роута
  layout: 'dashboard',      // Какой layout использовать
  title: 'Пользователи',    // Заголовок страницы
  pageTransition: {         // Анимация перехода
    name: 'fade',
    mode: 'out-in',
  },
})

// defineOptions — настройки компонента (имя, inheritAttrs)
defineOptions({
  name: 'UserProfilePage',  // Имя для DevTools
  inheritAttrs: false,      // Не наследовать атрибуты автоматически
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROPS — ВХОДНЫЕ ПАРАМЕТРЫ
// ═══════════════════════════════════════════════════════════════════════════
// Props — данные, которые РОДИТЕЛЬ передаёт РЕБЁНКУ.
// Ребёнок НЕ МОЖЕТ изменять props напрямую!

interface Props {
  /** ID пользователя для загрузки (обязательный) */
  userId: string

  /** Показывать аватар? (опциональный, по умолчанию true) */
  showAvatar?: boolean

  /** Размер карточки (опциональный, по умолчанию 'md') */
  size?: 'sm' | 'md' | 'lg'

  /** Данные пользователя, если уже загружены */
  initialData?: User | null
}

// withDefaults — задаёт значения по умолчанию для опциональных props
const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  size: 'md',
  initialData: null,
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. EMITS — СОБЫТИЯ (от ребёнка к родителю)
// ═══════════════════════════════════════════════════════════════════════════
// Emits — способ РЕБЁНКА сообщить РОДИТЕЛЮ о чём-то.
// Родитель слушает события через @event-name="handler"

const emit = defineEmits<{
  /** Пользователь обновлён — передаём новые данные */
  update: [user: User]

  /** Пользователь удалён — передаём ID */
  delete: [userId: string]

  /** Модалка закрыта — без аргументов */
  close: []

  /** Ошибка — передаём сообщение */
  error: [message: string]
}>()

// Как вызывать:
// emit('update', updatedUser)
// emit('delete', '123')
// emit('close')

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMPOSABLES — ПЕРЕИСПОЛЬЗУЕМАЯ ЛОГИКА
// ═══════════════════════════════════════════════════════════════════════════
// Composables — функции, которые возвращают реактивное состояние.
// Вызываются в начале setup, результат сохраняется в переменные.

// Встроенные Nuxt composables
const route = useRoute()           // Текущий роут (путь, параметры, query)
const router = useRouter()         // Навигация (push, replace, back)
const config = useRuntimeConfig()  // Конфигурация из nuxt.config.ts

// Supabase composables (@nuxtjs/supabase)
const supabase = useSupabaseClient<Database>()  // Клиент Supabase
const user = useSupabaseUser()                   // Текущий пользователь

// Кастомные composables проекта
const { showSuccess, showError } = useToast()   // Уведомления
const { isOnline } = useNetwork()               // Состояние сети

// Загрузка данных с SSR поддержкой
const {
  data: userData,      // Реактивные данные (Ref<User | null>)
  pending: isLoading,  // Идёт загрузка? (Ref<boolean>)
  error,               // Ошибка (Ref<Error | null>)
  refresh,             // Функция перезагрузки
} = await useAsyncData(
  `user-${props.userId}`,  // Уникальный ключ для кеширования
  () => fetchUser(props.userId),
  {
    watch: [() => props.userId],  // Перезагружать при изменении userId
    lazy: false,                   // Загружать сразу (не лениво)
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// 6. РЕАКТИВНОЕ СОСТОЯНИЕ (Reactive State)
// ═══════════════════════════════════════════════════════════════════════════
// Состояние компонента — данные, которые могут меняться.
// При изменении Vue автоматически обновляет DOM.

// ref() — для примитивов и простых значений
// Доступ к значению: переменная.value (в script), переменная (в template)
const isModalOpen = ref(false)           // boolean
const searchQuery = ref('')              // string
const selectedIds = ref<string[]>([])    // массив
const currentPage = ref(1)               // number

// reactive() — для объектов (без .value)
// Используйте когда нужен объект с несколькими связанными полями
const filters = reactive({
  search: '',
  role: '' as UserRole | '',
  status: 'active' as 'active' | 'inactive' | '',
  sortBy: 'created_at',
  sortOrder: 'desc' as 'asc' | 'desc',
})

const formData = reactive({
  email: '',
  fullName: '',
  role: 'user' as UserRole,
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. COMPUTED — ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ═══════════════════════════════════════════════════════════════════════════
// Computed — значение, которое АВТОМАТИЧЕСКИ пересчитывается
// при изменении зависимостей. Результат КЕШИРУЕТСЯ.

// Простой computed
const fullName = computed(() => {
  return `${formData.firstName} ${formData.lastName}`
})

// Computed с условием
const isFormValid = computed(() => {
  return formData.email.includes('@') && formData.fullName.length > 2
})

// Computed для фильтрации
const activeUsers = computed(() => {
  return users.value.filter(user => user.status === 'active')
})

// Computed с геттером и сеттером (редко нужен)
const selectedUser = computed({
  get: () => users.value.find(u => u.id === selectedId.value),
  set: (user) => { selectedId.value = user?.id ?? '' },
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. МЕТОДЫ — ФУНКЦИИ КОМПОНЕНТА
// ═══════════════════════════════════════════════════════════════════════════
// Обычные функции для обработки событий и логики.
// Используйте function declaration, не arrow functions (лучше читаемость).

/** Открыть модалку создания */
function openCreateModal() {
  // Сбросить форму
  Object.assign(formData, { email: '', fullName: '', role: 'user' })
  isModalOpen.value = true
}

/** Открыть модалку редактирования */
function openEditModal(user: User) {
  Object.assign(formData, {
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  })
  editingUserId.value = user.id
  isModalOpen.value = true
}

/** Сохранить пользователя (создание или обновление) */
async function saveUser() {
  try {
    if (editingUserId.value) {
      // Обновление существующего
      await updateUser(editingUserId.value, formData)
      showSuccess('Пользователь обновлён')
      emit('update', { ...formData, id: editingUserId.value })
    } else {
      // Создание нового
      const newUser = await createUser(formData)
      showSuccess('Пользователь создан')
      emit('update', newUser)
    }
    isModalOpen.value = false
  } catch (err) {
    showError(`Ошибка: ${(err as Error).message}`)
    emit('error', (err as Error).message)
  }
}

/** Удалить пользователя */
async function deleteUser(user: User) {
  if (!confirm(`Удалить ${user.email}?`)) return

  try {
    await supabase.from('users').delete().eq('id', user.id)
    showSuccess('Пользователь удалён')
    emit('delete', user.id)
    await refresh()
  } catch (err) {
    showError('Ошибка удаления')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. WATCH — НАБЛЮДАТЕЛИ
// ═══════════════════════════════════════════════════════════════════════════
// Watch — выполняет код при ИЗМЕНЕНИИ значения.
// Используйте для side effects: API вызовы, localStorage, аналитика.

// Следить за ref
watch(searchQuery, (newValue, oldValue) => {
  console.log(`Поиск изменился: ${oldValue} → ${newValue}`)
  // Сбросить на первую страницу при новом поиске
  currentPage.value = 1
})

// Следить за вложенным свойством reactive объекта
watch(
  () => filters.role,
  (newRole) => {
    console.log(`Фильтр роли: ${newRole}`)
  }
)

// Следить за несколькими значениями
watch(
  [currentPage, () => filters.sortBy],
  ([page, sortBy]) => {
    console.log(`Страница ${page}, сортировка ${sortBy}`)
    refresh()
  }
)

// Следить с опциями
watch(
  () => props.userId,
  async (newId) => {
    await refresh()
  },
  {
    immediate: true,  // Выполнить сразу при создании компонента
    deep: false,      // Глубокое наблюдение (для объектов)
  }
)

// watchEffect — автоматически отслеживает все зависимости
watchEffect(() => {
  // Этот код выполнится при изменении ЛЮБОЙ переменной внутри
  console.log(`User: ${props.userId}, Page: ${currentPage.value}`)
})

// ═══════════════════════════════════════════════════════════════════════════
// 10. LIFECYCLE HOOKS — ХУКИ ЖИЗНЕННОГО ЦИКЛА
// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle hooks — функции, вызываемые на определённых этапах жизни компонента.

// onMounted — компонент ДОБАВЛЕН в DOM (только на клиенте!)
// Используйте для: DOM манипуляций, подписок, инициализации библиотек
onMounted(() => {
  console.log('Компонент смонтирован')

  // Пример: фокус на инпуте
  inputRef.value?.focus()

  // Пример: подписка на события окна
  window.addEventListener('resize', handleResize)
})

// onUnmounted — компонент УДАЛЯЕТСЯ из DOM
// Используйте для: отписки, очистки таймеров, закрытия соединений
onUnmounted(() => {
  console.log('Компонент размонтирован')

  // ВАЖНО: всегда очищайте подписки!
  window.removeEventListener('resize', handleResize)
})

// onBeforeMount — перед добавлением в DOM
onBeforeMount(() => {
  console.log('Перед монтированием')
})

// onBeforeUnmount — перед удалением из DOM
onBeforeUnmount(() => {
  console.log('Перед размонтированием')
})

// onUpdated — после обновления DOM (при изменении реактивных данных)
onUpdated(() => {
  console.log('DOM обновлён')
})

// ═══════════════════════════════════════════════════════════════════════════
// 11. PROVIDE / INJECT (передача данных через уровни)
// ═══════════════════════════════════════════════════════════════════════════
// Если нужно передать данные глубоко вниз без "prop drilling"

// В родителе:
provide('theme', theme)
provide('currentUser', user)

// В любом потомке (на любой глубине):
const theme = inject('theme')
const currentUser = inject('currentUser')

// ═══════════════════════════════════════════════════════════════════════════
// 12. EXPOSE (что доступно родителю через ref)
// ═══════════════════════════════════════════════════════════════════════════
// По умолчанию в <script setup> ничего не доступно снаружи.
// defineExpose явно указывает, что можно вызвать через ref.

defineExpose({
  refresh,      // Родитель может вызвать: componentRef.value.refresh()
  resetForm,
  isFormValid,
})
</script>
```

## Форматирование кода

### Настройки ESLint Stylistic

| Параметр | Значение | Пример |
|----------|----------|--------|
| Отступы | 2 пробела | `··const x = 1` |
| Кавычки | Одинарные | `'строка'` |
| Точка с запятой | Без | `const x = 1` (не `const x = 1;`) |
| Запятая в конце | Да | `{ a: 1, b: 2, }` |
| Длина строки | 100 символов | Переносить если длиннее |

### JSDoc для функций

```typescript
/**
 * Форматирует дату в читаемый вид.
 *
 * @param date - Дата в ISO формате или объект Date
 * @param locale - Локаль для форматирования
 * @returns Отформатированная строка
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z')
 * // => '15 янв. 2024'
 *
 * @example
 * formatDate(new Date(), 'en-US')
 * // => 'Jan 15, 2024'
 */
export function formatDate(
  date: string | Date | null,
  locale = 'ru-RU'
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}