// ═══════════════════════════════════════════════════════════════════════════
// useCommunityModeration — Модерация и роли пользователей
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CommunityRoom,
  CommunityMemberRole,
  CommunityModerator,
  CommunityReportReason,
  GetMyRoleResponse,
  GetModeratorsResponse,
} from '~/types/community'

// ═══════════════════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════════════════

const USER_ROLES_CACHE_MAX = 100 // Максимум записей в кэше ролей

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Параметры composable */
interface UseCommunityModerationOptions {
  currentRoom: Ref<CommunityRoom | null>
  userGlobalRole: ComputedRef<string | undefined>
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Управление ролями и модерацией в чате.
 *
 * Функционал:
 * - Загрузка роли пользователя в комнате
 * - Кэширование ролей (LRU)
 * - Mute/Unmute пользователей
 * - Репорты сообщений
 * - Назначение ролей
 *
 * @param options - Зависимости (currentRoom, userGlobalRole)
 */
export function useCommunityModeration(options: UseCommunityModerationOptions) {
  const { currentRoom, userGlobalRole } = options

  // ═══════════════════════════════════════════════════════════════════════════
  // РЕАКТИВНОЕ СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  const moderators = ref<CommunityModerator[]>([])
  const userRolesCache = ref<Map<number, CommunityMemberRole>>(new Map())
  const currentUserRole = ref<CommunityMemberRole>('member')
  const isMuted = ref(false)
  const mutedUntil = ref<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Загрузить роль пользователя в комнате */
  async function loadUserRole(roomId: number) {
    try {
      const response = await $fetch<GetMyRoleResponse>(`/api/community/rooms/${roomId}/my-role`)
      currentUserRole.value = response.role
      isMuted.value = response.isMuted
      mutedUntil.value = response.mutedUntil

      // LRU-подобная очистка: удаляем старые записи при превышении лимита
      if (userRolesCache.value.size >= USER_ROLES_CACHE_MAX) {
        // Map сохраняет порядок вставки, удаляем первую (самую старую) запись
        const firstKey = userRolesCache.value.keys().next().value
        if (firstKey !== undefined) {
          userRolesCache.value.delete(firstKey)
        }
      }
      userRolesCache.value.set(roomId, response.role)
    }
    catch {
      currentUserRole.value = 'member'
      isMuted.value = false
      mutedUntil.value = null
    }
  }

  /** Загрузить модераторов комнаты */
  async function loadModerators(roomId: number) {
    try {
      const response = await $fetch<GetModeratorsResponse>('/api/community/moderation/moderators', {
        query: { roomId },
      })
      moderators.value = response.moderators
    }
    catch {
      moderators.value = []
    }
  }

  /** Проверка роли модератора */
  function isModerator(roomId?: number): boolean {
    // Сначала проверяем глобальную роль admin
    if (userGlobalRole.value === 'admin') return true

    // Затем проверяем роль в конкретной комнате
    const rid = roomId || currentRoom.value?.id
    if (rid) {
      const role = userRolesCache.value.get(rid)
      return role === 'moderator' || role === 'admin'
    }

    // Или текущую загруженную роль
    return currentUserRole.value === 'moderator' || currentUserRole.value === 'admin'
  }

  /** Проверка, является ли пользователь модератором комнаты */
  function isUserModerator(userId: number): boolean {
    return moderators.value.some(m => m.userId === userId)
  }

  /** Замутить пользователя */
  async function muteUser(userId: number, duration: number, reason?: string) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/mute', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId,
        duration,
        reason,
      },
    })
  }

  /** Снять мут */
  async function unmuteUser(userId: number) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/unmute', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId,
      },
    })
  }

  /** Пожаловаться на сообщение */
  async function reportMessage(messageId: number, reason: CommunityReportReason, details?: string) {
    await $fetch(`/api/community/messages/${messageId}/report`, {
      method: 'POST',
      body: { reason, details },
    })
  }

  /** Назначить роль пользователю (только global admin) */
  async function setMemberRole(userId: number, role: CommunityMemberRole) {
    if (!currentRoom.value) throw new Error('Комната не выбрана')

    await $fetch('/api/community/moderation/set-role', {
      method: 'POST',
      body: {
        roomId: currentRoom.value.id,
        userId,
        role,
      },
    })

    // Перезагружаем модераторов
    await loadModerators(currentRoom.value.id)
  }

  /** Сбросить состояние (при смене комнаты) */
  function reset() {
    moderators.value = []
    currentUserRole.value = 'member'
    isMuted.value = false
    mutedUntil.value = null
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    moderators: readonly(moderators),
    currentUserRole: readonly(currentUserRole),
    isMuted: readonly(isMuted),
    mutedUntil: readonly(mutedUntil),

    // Actions
    loadUserRole,
    loadModerators,
    isModerator,
    isUserModerator,
    muteUser,
    unmuteUser,
    reportMessage,
    setMemberRole,
    reset,
  }
}
