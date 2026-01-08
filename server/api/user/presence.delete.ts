// DELETE /api/user/presence
// Пометить пользователя как offline (при выходе)

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Помечаем как offline
  const { error } = await supabase
    .from('users')
    .update({
      online_status: 'offline',
      last_seen_at: new Date().toISOString()
    })
    .eq('id', sessionUser.id)

  if (error) {
    console.error('Error updating presence:', error)
    throw createError({ statusCode: 500, message: 'Ошибка обновления статуса' })
  }

  return { success: true, status: 'offline' }
})
