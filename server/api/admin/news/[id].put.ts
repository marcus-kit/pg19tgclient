import { createClient } from '@supabase/supabase-js'

interface UpdateNewsData {
  title?: string
  summary?: string
  content?: string
  category?: 'announcement' | 'protocol' | 'notification'
  status?: 'draft' | 'published' | 'archived'
  publishedAt?: string | null
  expiresAt?: string | null
  isPinned?: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateNewsData>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Маппинг camelCase → snake_case
  const dbData: Record<string, unknown> = {}

  if (body.title !== undefined) dbData.title = body.title
  if (body.summary !== undefined) dbData.summary = body.summary
  if (body.content !== undefined) dbData.content = body.content
  if (body.category !== undefined) dbData.category = body.category
  if (body.status !== undefined) dbData.status = body.status
  if (body.publishedAt !== undefined) dbData.published_at = body.publishedAt
  if (body.expiresAt !== undefined) dbData.expires_at = body.expiresAt
  if (body.isPinned !== undefined) dbData.is_pinned = body.isPinned

  // Если меняется статус на published и publishedAt не указан, ставим текущее время
  if (body.status === 'published' && !body.publishedAt) {
    dbData.published_at = new Date().toISOString()
  }

  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  const { data, error } = await supabase
    .from('news')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении новости'
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
