import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Получаем новость с вложениями
  const { data: newsItem, error: newsError } = await supabase
    .from('news')
    .select(`
      *,
      news_attachments (
        id,
        file_name,
        file_path,
        file_size,
        mime_type,
        sort_order
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (newsError || !newsItem) {
    throw createError({
      statusCode: 404,
      message: 'Новость не найдена'
    })
  }

  return {
    news: {
      id: newsItem.id,
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      publishedAt: newsItem.published_at,
      isPinned: newsItem.is_pinned,
      createdAt: newsItem.date_created,
      attachments: (newsItem.news_attachments || []).map((att: any) => ({
        id: att.id,
        fileName: att.file_name,
        filePath: att.file_path,
        fileSize: att.file_size,
        mimeType: att.mime_type,
        sortOrder: att.sort_order
      }))
    }
  }
})
