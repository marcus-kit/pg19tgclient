import { createClient } from '@supabase/supabase-js'

interface AchievementRow {
  id: number
  type: string
  title: string
  description: string
  icon: string
  progress: number
  max_progress: number
  unlocked_at: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

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
