import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  // Используем SERVICE_ROLE key для админских операций
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Строим запрос
  let queryBuilder = supabase
    .from('news')
    .select('*')
    .order('date_created', { ascending: false })

  // Фильтр по статусу
  if (query.status && query.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', query.status)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке новостей'
    })
  }

  // Маппинг snake_case → camelCase
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
    authorId: item.author_id,
    createdAt: item.date_created,
    updatedAt: item.date_updated
  }))

  return { news }
})
