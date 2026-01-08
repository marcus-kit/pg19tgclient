import { createClient } from '@supabase/supabase-js'

interface ServiceRow {
  id: string
  name: string
  description: string | null
  price: number
  slug: string | null
  icon: string | null
  color: string | null
  hero_title: string | null
  hero_subtitle: string | null
  features: unknown[] | null
  equipment: unknown[] | null
  is_active: boolean
  sort_order: number
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке услуг'
    })
  }

  return (data as ServiceRow[]).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price / 100, // kopeks → rubles
    slug: s.slug,
    icon: s.icon || 'heroicons:cube',
    color: s.color || 'primary',
    heroTitle: s.hero_title,
    heroSubtitle: s.hero_subtitle,
    features: s.features || [],
    equipment: s.equipment || []
  }))
})
