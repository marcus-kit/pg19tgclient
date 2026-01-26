import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseClient: SupabaseClient | null = null

/**
 * Возвращает Supabase client для серверных операций.
 * Использует service_role ключ для полного доступа к БД.
 */
export function useSupabaseServer(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient
  }

  const config = useRuntimeConfig()

  _supabaseClient = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return _supabaseClient
}
