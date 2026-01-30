// ═══════════════════════════════════════════════════════════════════════════
// useCommunityRooms — Управление комнатами чата
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunityRoom, GetRoomsResponse } from '~/types/community'

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Параметры composable */
interface UseCommunityRoomsOptions {
  supabase: SupabaseClient
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Управление списком комнат чата.
 *
 * Функционал:
 * - Загрузка списка комнат
 * - Подписка на обновления (members_count, messages_count)
 * - Выбор комнаты
 * - Auto-join и mark-read
 *
 * @param options - Зависимости (supabase client)
 */
export function useCommunityRooms(options: UseCommunityRoomsOptions) {
  const { supabase } = options

  // ═══════════════════════════════════════════════════════════════════════════
  // РЕАКТИВНОЕ СОСТОЯНИЕ
  // ═══════════════════════════════════════════════════════════════════════════

  const rooms = ref<CommunityRoom[]>([])
  const currentRoom = ref<CommunityRoom | null>(null)
  const isLoadingRooms = ref(false)
  const error = ref<string | null>(null)

  let roomsChannel: ReturnType<typeof supabase.channel> | null = null

  // ═══════════════════════════════════════════════════════════════════════════
  // МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  /** Загрузить список комнат */
  async function loadRooms() {
    isLoadingRooms.value = true
    error.value = null

    try {
      const response = await $fetch<GetRoomsResponse>('/api/community/rooms')
      rooms.value = response.rooms

      // Подписываемся на изменения в комнатах (для обновления счётчиков)
      await subscribeToRoomsUpdates()
    }
    catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      error.value = err.data?.message || 'Ошибка загрузки комнат'
      throw e
    }
    finally {
      isLoadingRooms.value = false
    }
  }

  /** Подписка на обновления комнат (members_count и т.д.) */
  async function subscribeToRoomsUpdates() {
    // Отписываемся от предыдущего канала
    if (roomsChannel) {
      await supabase.removeChannel(roomsChannel)
      roomsChannel = null
    }

    roomsChannel = supabase
      .channel('community_rooms_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_rooms',
        },
        (payload) => {
          const updated = payload.new as { id: number, members_count: number, messages_count: number }
          const idx = rooms.value.findIndex(r => r.id === updated.id)
          if (idx !== -1) {
            rooms.value[idx] = {
              ...rooms.value[idx],
              membersCount: updated.members_count,
              messagesCount: updated.messages_count,
            }
          }
        },
      )
      .subscribe()
  }

  /** Отписка от обновлений комнат */
  async function unsubscribeFromRooms() {
    if (roomsChannel) {
      await supabase.removeChannel(roomsChannel)
      roomsChannel = null
    }
  }

  /** Вступить в комнату (auto-join) */
  async function joinRoom(roomId: number) {
    try {
      await $fetch(`/api/community/rooms/${roomId}/join`, { method: 'POST' })
    }
    catch {
      // Игнорируем ошибки — не критично
    }
  }

  /** Отметить комнату как прочитанную */
  async function markAsRead() {
    if (!currentRoom.value) return

    try {
      await $fetch('/api/community/rooms/mark-read', {
        method: 'POST',
        body: { roomId: currentRoom.value.id },
      })
    }
    catch {
      // Игнорируем ошибки
    }
  }

  /** Выбрать комнату (установить current) */
  function setCurrentRoom(room: CommunityRoom | null) {
    currentRoom.value = room
  }

  /** Сбросить текущую комнату */
  function resetCurrentRoom() {
    currentRoom.value = null
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ВОЗВРАТ
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    rooms: readonly(rooms),
    currentRoom,
    isLoadingRooms: readonly(isLoadingRooms),
    error,

    // Actions
    loadRooms,
    joinRoom,
    markAsRead,
    setCurrentRoom,
    resetCurrentRoom,
    unsubscribeFromRooms,
  }
}
