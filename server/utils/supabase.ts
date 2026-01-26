import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Возвращает Supabase client для серверных операций.
 * Использует service_role ключ для полного доступа к БД.
 */
export function useSupabaseServer(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
