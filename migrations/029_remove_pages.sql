-- Migration: 029_remove_pages.sql
-- Description: Удаление неиспользуемой таблицы pages
-- Created: 2026-01-08

-- =====================================================
-- Причина удаления:
-- Таблица pages не используется в коде приложения.
-- Для статического контента используется site_content (CMS).
-- =====================================================

-- Удаляем RLS политики
DROP POLICY IF EXISTS "pages_public_read_published" ON public.pages;
DROP POLICY IF EXISTS "pages_service_role_all" ON public.pages;

-- Удаляем триггер и функцию
DROP TRIGGER IF EXISTS trigger_update_pages_updated_at ON public.pages;
DROP FUNCTION IF EXISTS update_pages_updated_at();

-- Удаляем индексы
DROP INDEX IF EXISTS idx_pages_slug;
DROP INDEX IF EXISTS idx_pages_is_published;
DROP INDEX IF EXISTS idx_pages_sort_order;

-- Удаляем FK constraint (ссылается на admins)
ALTER TABLE public.pages DROP CONSTRAINT IF EXISTS pages_author_id_fkey;

-- Удаляем таблицу
DROP TABLE IF EXISTS public.pages;


-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- Восстановление из 021_pages.sql
CREATE TABLE IF NOT EXISTS pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pages IS 'Статические страницы сайта (FAQ, О нас, Правила)';
COMMENT ON COLUMN pages.slug IS 'URL-идентификатор страницы';
COMMENT ON COLUMN pages.meta_title IS 'SEO заголовок';
COMMENT ON COLUMN pages.meta_description IS 'SEO описание';

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);

CREATE OR REPLACE FUNCTION update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_updated_at();

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_public_read_published" ON pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "pages_service_role_all" ON pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
*/
