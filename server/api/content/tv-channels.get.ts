import { createClient } from '@supabase/supabase-js'

interface ChannelCategoryRow {
  id: string
  name: string
  slug: string
  icon: string
  channel_count: number
  sort_order: number
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  const { data, error } = await supabase
    .from('tv_channel_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching TV channels:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке каналов'
    })
  }

  return (data as ChannelCategoryRow[]).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    count: c.channel_count
  }))
})
