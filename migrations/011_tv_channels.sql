-- Migration: 011_tv_channels.sql
-- Категории ТВ каналов для страницы /tv

CREATE TABLE IF NOT EXISTS public.tv_channel_categories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'heroicons:tv',
  channel_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed data (из tv.vue)
INSERT INTO public.tv_channel_categories (name, slug, icon, channel_count, sort_order) VALUES
  ('Эфирные', 'broadcast', 'heroicons:tv', 23, 10),
  ('Новостные', 'news', 'heroicons:newspaper', 14, 20),
  ('Спортивные', 'sports', 'heroicons:trophy', 15, 30),
  ('Детские', 'kids', 'heroicons:face-smile', 13, 40),
  ('Познавательные', 'educational', 'heroicons:academic-cap', 38, 50),
  ('Развлекательные', 'entertainment', 'heroicons:sparkles', 42, 60),
  ('Музыкальные', 'music', 'heroicons:musical-note', 16, 70),
  ('Кино', 'movies', 'heroicons:film', 31, 80),
  ('HD-каналы', 'hd', 'heroicons:play', 23, 90),
  ('4K-каналы', '4k', 'heroicons:play-circle', 2, 100),
  ('Региональные', 'regional', 'heroicons:map-pin', 4, 110),
  ('Для взрослых', 'adult', 'heroicons:lock-closed', 5, 120)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  channel_count = EXCLUDED.channel_count,
  sort_order = EXCLUDED.sort_order;

-- RLS
ALTER TABLE public.tv_channel_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "TV categories viewable by everyone" ON public.tv_channel_categories;
CREATE POLICY "TV categories viewable by everyone"
  ON public.tv_channel_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to tv_channel_categories" ON public.tv_channel_categories;
CREATE POLICY "Service role full access to tv_channel_categories"
  ON public.tv_channel_categories FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE public.tv_channel_categories IS 'Категории ТВ каналов для страницы /tv';
