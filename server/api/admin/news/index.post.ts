import { createClient } from '@supabase/supabase-js'

interface CreateNewsData {
  title: string
  summary?: string
  content: string
  category: 'announcement' | 'protocol' | 'notification'
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string | null
  expiresAt?: string | null
  isPinned?: boolean
  authorId: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CreateNewsData>(event)

  // Валидация
  if (!body.title || !body.content) {
    throw createError({
      statusCode: 400,
      message: 'Заголовок и контент обязательны'
    })
  }

  if (!body.authorId) {
    throw createError({
      statusCode: 400,
      message: 'authorId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Если status = published и publishedAt не указан, ставим текущее время
  const publishedAt = body.status === 'published' && !body.publishedAt
    ? new Date().toISOString()
    : body.publishedAt

  const { data, error } = await supabase
    .from('news')
    .insert({
      title: body.title,
      summary: body.summary || null,
      content: body.content,
      category: body.category,
      status: body.status,
      published_at: publishedAt,
      expires_at: body.expiresAt || null,
      is_pinned: body.isPinned || false,
      author_id: body.authorId
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании новости'
    })
  }

  return {
    success: true,
    news: {
      id: data.id,
      title: data.title,
      status: data.status
    }
  }
})
