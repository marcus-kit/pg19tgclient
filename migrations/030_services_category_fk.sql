-- Migration: 030_services_category_fk.sql
-- Description: Добавление FK category_id в services для связи с service_categories
-- Created: 2026-01-08

-- =====================================================
-- 1. Добавление колонки category_id
-- =====================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category_id BIGINT;

-- =====================================================
-- 2. FK constraint
-- =====================================================

ALTER TABLE public.services
  ADD CONSTRAINT services_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES public.service_categories(id)
  ON DELETE SET NULL;

-- Индекс для FK (ускоряет JOIN и поиск по категории)
CREATE INDEX IF NOT EXISTS idx_services_category_id
  ON public.services(category_id);

-- =====================================================
-- 3. Комментарий
-- =====================================================

COMMENT ON COLUMN public.services.category_id IS 'FK на категорию услуги (service_categories.id)';

-- =====================================================
-- 4. Seed категорий (если ещё нет)
-- =====================================================

-- Интернет
INSERT INTO public.service_categories (name, slug, description, icon, sort_order)
VALUES ('Интернет', 'internet', 'Тарифы интернет-подключения', 'heroicons:globe-alt', 1)
ON CONFLICT (slug) DO NOTHING;

-- Телевидение
INSERT INTO public.service_categories (name, slug, description, icon, sort_order)
VALUES ('Телевидение', 'tv', 'Пакеты цифрового ТВ', 'heroicons:tv', 2)
ON CONFLICT (slug) DO NOTHING;

-- Видеонаблюдение
INSERT INTO public.service_categories (name, slug, description, icon, sort_order)
VALUES ('Видеонаблюдение', 'cctv', 'Системы видеонаблюдения', 'heroicons:video-camera', 3)
ON CONFLICT (slug) DO NOTHING;

-- Домофония
INSERT INTO public.service_categories (name, slug, description, icon, sort_order)
VALUES ('Домофония', 'intercom', 'IP-домофоны и видеодомофоны', 'heroicons:phone', 4)
ON CONFLICT (slug) DO NOTHING;

-- Дополнительные услуги
INSERT INTO public.service_categories (name, slug, description, icon, sort_order)
VALUES ('Дополнительные услуги', 'additional', 'Дополнительные сервисы и оборудование', 'heroicons:plus-circle', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 5. Обновление существующих услуг (связь с категориями)
-- =====================================================

-- Интернет тарифы (по названию или slug)
UPDATE public.services s
SET category_id = sc.id
FROM public.service_categories sc
WHERE sc.slug = 'internet'
  AND (
    s.slug LIKE 'internet%'
    OR s.name ILIKE '%интернет%'
    OR s.name ILIKE '%мбит%'
  )
  AND s.category_id IS NULL;

-- ТВ тарифы
UPDATE public.services s
SET category_id = sc.id
FROM public.service_categories sc
WHERE sc.slug = 'tv'
  AND (
    s.slug LIKE 'tv%'
    OR s.name ILIKE '%тв%'
    OR s.name ILIKE '%телевидение%'
    OR s.name ILIKE '%каналов%'
  )
  AND s.category_id IS NULL;

-- Видеонаблюдение
UPDATE public.services s
SET category_id = sc.id
FROM public.service_categories sc
WHERE sc.slug = 'cctv'
  AND (
    s.slug LIKE 'cctv%'
    OR s.name ILIKE '%видеонаблюдение%'
    OR s.name ILIKE '%камер%'
  )
  AND s.category_id IS NULL;

-- Домофония
UPDATE public.services s
SET category_id = sc.id
FROM public.service_categories sc
WHERE sc.slug = 'intercom'
  AND (
    s.slug LIKE 'intercom%'
    OR s.name ILIKE '%домофон%'
  )
  AND s.category_id IS NULL;

-- Остальные → Дополнительные услуги
UPDATE public.services s
SET category_id = sc.id
FROM public.service_categories sc
WHERE sc.slug = 'additional'
  AND s.category_id IS NULL;


-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- Удаление FK и колонки
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
DROP INDEX IF EXISTS idx_services_category_id;
ALTER TABLE public.services DROP COLUMN IF EXISTS category_id;
*/
