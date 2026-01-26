// ═══════════════════════════════════════════════════════════════════════════
// useCommunityPresence — Отслеживание онлайн-пользователей
// ═══════════════════════════════════════════════════════════════════════════

import type { RealtimeChannel } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Данные пользователя в Presence */
export interface PresenceUser {
  id: string
  name: string
  avatar?: string | null
}

/** Параметры composable */
interface UseCommunityPresenceOptions {
  channel: Ref<RealtimeChannel | null>
  userId: ComputedRef<string | undefined>
  userName: ComputedRef<string>
  userAvatar: ComputedRef<string | null | undefined>
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Отслеживание онлайн-пользователей через Supabase Presence.
 *
 * Функционал:
 * - Синхронизация состояния онлайн-пользователей
 * - Track/Untrack текущего пользователя
 * - Подсчёт количества онлайн
 *
 * @param options - Зависимости (channel, user info)
 */
export function useCommunityPresence(options: UseCommunityPresenceOptions) {
  const { channel, userId, userName, userAvatar } = options

  // ═══════════════════════════════════════════════════════════════════════════
  // РЕАКТИВНОЕ СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  const onlineUsers = ref<Map<string, PresenceUser>>(new Map())

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  const onlineCount = computed(() => onlineUsers.value.size)

  // ═══════════════════════════════════════════════════════════════════════════
  // МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Синхронизация Presence state */
  function syncPresenceState() {
    if (!channel.value) return

    const state = channel.value.presenceState<PresenceUser>()
    // Полная замена Map вместо clear+set (оптимизация для Vue reactivity)
    const newMap = new Map<string, PresenceUser>()

    for (const [_key, presences] of Object.entries(state)) {
      for (const presence of presences as PresenceUser[]) {
        // Используем id как ключ для дедупликации
        newMap.set(String(presence.id), presence)
      }
    }

    onlineUsers.value = newMap
  }

  /** Обработчик join события */
  function handleJoin(newPresences: PresenceUser[]) {
    for (const presence of newPresences) {
      onlineUsers.value.set(String(presence.id), presence)
    }
  }

  /** Обработчик leave события */
  function handleLeave(leftPresences: PresenceUser[]) {
    for (const presence of leftPresences) {
      onlineUsers.value.delete(String(presence.id))
    }
  }

  /** Track текущего пользователя в комнате */
  async function trackPresence() {
    if (!channel.value || !userId.value) return

    await channel.value.track({
      id: userId.value,
      name: userName.value,
      avatar: userAvatar.value,
    })
  }

  /** Untrack при выходе из комнаты */
  async function untrackPresence() {
    if (!channel.value) return
    await channel.value.untrack()
    onlineUsers.value.clear()
  }

  /** Очистить состояние */
  function reset() {
    onlineUsers.value.clear()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    onlineUsers: readonly(onlineUsers),
    onlineCount,

    // Actions
    syncPresenceState,
    handleJoin,
    handleLeave,
    trackPresence,
    untrackPresence,
    reset,
  }
}
