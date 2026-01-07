import { createClient } from '@supabase/supabase-js'

interface ContentRow {
  page: string
  section: string
  content: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const page = getRouterParam(event, 'page')

  if (!page) {
    throw createError({
      statusCode: 400,
      message: 'page обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Получаем контент страницы + глобальный
  const { data, error } = await supabase
    .from('site_content')
    .select('page, section, content')
    .in('page', [page, 'global'])
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching page content:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке контента'
    })
  }

  // Преобразуем в удобный формат: { section: content }
  const result: Record<string, Record<string, unknown>> = {}

  for (const row of (data as ContentRow[])) {
    result[row.section] = row.content
  }

  return result
})
