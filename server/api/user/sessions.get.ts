interface SessionRow {
  id: string
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  location: string | null
  last_active_at: string | null
  is_current: boolean
  created_at: string
}

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию - userId берём из сессии
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const supabase = useSupabaseServer()

  const { data, error } = await supabase
    .from('auth_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('terminated_at', null)
    .order('last_active_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке сессий'
    })
  }

  return (data as SessionRow[]).map(s => ({
    id: s.id,
    device: s.device_type || 'Неизвестно',
    browser: s.browser || 'Неизвестный браузер',
    os: s.os || 'Неизвестная ОС',
    ip: s.ip_address || '***',
    location: s.location || 'Неизвестно',
    lastActive: s.last_active_at || s.created_at,
    current: s.is_current
  }))
})
