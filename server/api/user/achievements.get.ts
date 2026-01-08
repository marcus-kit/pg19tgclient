interface AchievementRow {
  id: string
  type: string
  title: string
  description: string
  icon: string
  progress: number
  max_progress: number
  unlocked_at: string | null
}

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию - userId берём из сессии
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const supabase = useSupabaseServer()

  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching achievements:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке достижений'
    })
  }

  // Маппинг snake_case → camelCase
  return (data as AchievementRow[]).map(a => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    icon: a.icon,
    progress: a.progress,
    maxProgress: a.max_progress,
    unlocked: a.unlocked_at !== null,
    unlockedAt: a.unlocked_at
  }))
})
