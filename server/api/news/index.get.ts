import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  // Публичный доступ через ANON key (RLS автоматически фильтрует)
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  let queryBuilder = supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  // Фильтр по категории
  if (query.category) {
    queryBuilder = queryBuilder.eq('category', query.category)
  }

  // Фильтр активных (не истёкших)
  if (query.active === 'true') {
    queryBuilder = queryBuilder.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке новостей'
    })
  }

  // Преобразование snake_case → camelCase
  const news = (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    content: item.content,
    category: item.category,
    status: item.status,
    publishedAt: item.published_at,
    expiresAt: item.expires_at,
    isPinned: item.is_pinned,
    createdAt: item.date_created,
    updatedAt: item.date_updated
  }))

  return { news }
})
