-- Migration: 010_extend_services.sql
-- Расширение таблицы services для контента страниц

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS hero_title text,
  ADD COLUMN IF NOT EXISTS hero_subtitle text,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'heroicons:cube',
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '[]'::jsonb;

-- Уникальный индекс для slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug
  ON public.services(slug)
  WHERE slug IS NOT NULL;

-- Обновляем существующие сервисы данными из компонентов
UPDATE public.services SET
  slug = 'internet-100',
  icon = 'heroicons:wifi',
  color = 'primary',
  hero_title = 'Интернет без ограничений',
  hero_subtitle = 'Стабильное соединение для всей семьи',
  features = '[
    {"icon": "heroicons:bolt", "title": "100 Мбит/с", "description": "Стабильная скорость для работы и развлечений"},
    {"icon": "heroicons:device-tablet", "title": "До 5 устройств", "description": "Одновременное подключение"}
  ]'::jsonb
WHERE name ILIKE '%100%';

UPDATE public.services SET
  slug = 'internet-300',
  icon = 'heroicons:wifi',
  color = 'primary',
  hero_title = 'Интернет для активных',
  hero_subtitle = 'Быстрый интернет для игр и стриминга',
  features = '[
    {"icon": "heroicons:bolt", "title": "300 Мбит/с", "description": "Высокая скорость для требовательных задач"},
    {"icon": "heroicons:device-tablet", "title": "До 10 устройств", "description": "Одновременное подключение"}
  ]'::jsonb
WHERE name ILIKE '%300%';

UPDATE public.services SET
  slug = 'internet-500',
  icon = 'heroicons:wifi',
  color = 'primary',
  hero_title = 'Интернет PRO',
  hero_subtitle = 'Максимальная скорость для профессионалов',
  features = '[
    {"icon": "heroicons:bolt", "title": "500 Мбит/с", "description": "Профессиональная скорость"},
    {"icon": "heroicons:device-tablet", "title": "До 15 устройств", "description": "Умный дом и офис"}
  ]'::jsonb
WHERE name ILIKE '%500%';

UPDATE public.services SET
  slug = 'internet-1000',
  icon = 'heroicons:wifi',
  color = 'primary',
  hero_title = 'Гигабитный интернет',
  hero_subtitle = 'Без ограничений и компромиссов',
  features = '[
    {"icon": "heroicons:bolt", "title": "1000 Мбит/с", "description": "Максимальная скорость"},
    {"icon": "heroicons:no-symbol", "title": "Без ограничений", "description": "Вся полоса — ваша"}
  ]'::jsonb
WHERE name ILIKE '%1000%';

UPDATE public.services SET
  slug = 'tv-basic',
  icon = 'heroicons:tv',
  color = 'secondary'
WHERE name ILIKE '%ТВ Базов%' OR name ILIKE '%TV Basic%';

UPDATE public.services SET
  slug = 'tv-extended',
  icon = 'heroicons:tv',
  color = 'secondary'
WHERE name ILIKE '%ТВ Расшир%' OR name ILIKE '%TV Extended%';

COMMENT ON COLUMN public.services.slug IS 'URL-friendly идентификатор';
COMMENT ON COLUMN public.services.features IS 'Список features [{icon, title, description}]';
COMMENT ON COLUMN public.services.equipment IS 'Оборудование [{name, description, price_monthly}]';
COMMENT ON COLUMN public.services.hero_title IS 'Заголовок для страницы тарифа';
COMMENT ON COLUMN public.services.hero_subtitle IS 'Подзаголовок для страницы тарифа';
