// ═══════════════════════════════════════════════════════════════════════════
// useCommunityTyping — Индикаторы набора текста
// ═══════════════════════════════════════════════════════════════════════════

import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CommunityRoom } from '~/types/community'

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Данные о печатающем пользователе */
interface TypingUser {
  name: string
  timestamp: number
}

/** Payload события typing */
interface TypingPayload {
  userId: string
  name: string
  roomId: string | number
}

/** Параметры composable */
interface UseCommunityTypingOptions {
  channel: Ref<RealtimeChannel | null>
  currentRoom: Ref<CommunityRoom | null>
  userId: ComputedRef<string | undefined>
  userName: ComputedRef<string>
}

// ═══════════════════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════════════════

const TYPING_DEBOUNCE = 2000 // Отправляем typing не чаще 2 сек
const TYPING_TIMEOUT = 3000 // Считаем что перестали печатать через 3 сек
const TYPING_CLEANUP_INTERVAL = 2000 // Интервал очистки
const MAX_TYPING_USERS = 10 // Максимум пользователей (защита от memory leak)
const TYPING_EMPTY_CYCLES_TO_STOP = 5 // Ждём N пустых циклов перед остановкой

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Управление индикаторами набора текста в чате.
 *
 * Функционал:
 * - Отправка broadcast о наборе текста (с debounce)
 * - Получение и отображение typing других пользователей
 * - Автоматическая очистка устаревших индикаторов
 *
 * @param options - Зависимости (channel, currentRoom, user info)
 */
export function useCommunityTyping(options: UseCommunityTypingOptions) {
  const { channel, currentRoom, userId, userName } = options

  // ═══════════════════════════════════════════════════════════════════════════
  // РЕАКТИВНОЕ СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  const typingUsers = ref<Map<string, TypingUser>>(new Map())
  let typingCleanupInterval: ReturnType<typeof setInterval> | null = null
  let typingEmptyCycles = 0 // Счётчик пустых циклов для graceful stop
  let lastTypingBroadcast = 0

  // ═══════════════════════════════════════════════════════════════════════════
  // МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Отправить broadcast о наборе текста (с debounce) */
  function broadcastTyping() {
    if (!channel.value || !currentRoom.value || !userId.value) return

    const now = Date.now()
    if (now - lastTypingBroadcast < TYPING_DEBOUNCE) return

    lastTypingBroadcast = now

    channel.value.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: userId.value,
        name: userName.value,
        roomId: currentRoom.value.id,
      },
    })
  }

  /** Обработчик входящих typing событий */
  function handleTypingBroadcast(payload: TypingPayload) {
    // Игнорируем свои события
    if (payload.userId === userId.value) return
    // Игнорируем события из других комнат
    if (String(payload.roomId) !== String(currentRoom.value?.id)) return

    // Лимит на количество (защита от memory leak в больших комнатах)
    if (typingUsers.value.size >= MAX_TYPING_USERS && !typingUsers.value.has(payload.userId)) {
      // Удаляем самую старую запись
      let oldestKey: string | null = null
      let oldestTime = Infinity
      for (const [key, data] of typingUsers.value) {
        if (data.timestamp < oldestTime) {
          oldestTime = data.timestamp
          oldestKey = key
        }
      }
      if (oldestKey) typingUsers.value.delete(oldestKey)
    }

    typingUsers.value.set(payload.userId, {
      name: payload.name,
      timestamp: Date.now(),
    })

    // Запускаем очистку если ещё не запущена
    startTypingCleanup()
  }

  /** Убрать typing индикатор для пользователя (при получении сообщения) */
  function removeTyping(targetUserId: string) {
    typingUsers.value.delete(targetUserId)
  }

  /** Периодическая очистка неактивных typing */
  function startTypingCleanup() {
    if (typingCleanupInterval) return

    typingEmptyCycles = 0 // Сброс счётчика при старте

    typingCleanupInterval = setInterval(() => {
      const now = Date.now()
      let hasActive = false

      for (const [targetUserId, data] of typingUsers.value) {
        if (now - data.timestamp > TYPING_TIMEOUT) {
          typingUsers.value.delete(targetUserId)
        } else {
          hasActive = true
        }
      }

      // Graceful stop: ждём несколько пустых циклов перед остановкой
      if (!hasActive) {
        typingEmptyCycles++
        if (typingEmptyCycles >= TYPING_EMPTY_CYCLES_TO_STOP && typingCleanupInterval) {
          clearInterval(typingCleanupInterval)
          typingCleanupInterval = null
          typingEmptyCycles = 0
        }
      } else {
        typingEmptyCycles = 0 // Сброс при активности
      }
    }, TYPING_CLEANUP_INTERVAL)
  }

  /** Остановить очистку typing */
  function stopTypingCleanup() {
    if (typingCleanupInterval) {
      clearInterval(typingCleanupInterval)
      typingCleanupInterval = null
    }
    typingUsers.value.clear()
  }

  /** Очистить все данные (при смене комнаты) */
  function reset() {
    stopTypingCleanup()
    lastTypingBroadcast = 0
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    typingUsers: readonly(typingUsers),

    // Actions
    broadcastTyping,
    handleTypingBroadcast,
    removeTyping,
    stopTypingCleanup,
    reset,
  }
}
