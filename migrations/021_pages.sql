-- Migration: 021_pages.sql
-- Description: Статические страницы (about, faq, rules)
-- Created: 2026-01-08

-- ============================================
-- TABLE: pages
-- Статические страницы сайта
-- ============================================

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

-- Комментарии
COMMENT ON TABLE pages IS 'Статические страницы сайта (FAQ, О нас, Правила)';
COMMENT ON COLUMN pages.slug IS 'URL-идентификатор страницы (например: faq, about, rules)';
COMMENT ON COLUMN pages.meta_title IS 'SEO заголовок для <title>';
COMMENT ON COLUMN pages.meta_description IS 'SEO описание для <meta description>';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pages_updated_at ON pages;
CREATE TRIGGER trigger_update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_updated_at();

-- RLS политики
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения опубликованных страниц
CREATE POLICY "pages_public_read_published" ON pages
  FOR SELECT
  USING (is_published = true);

-- Service role имеет полный доступ
CREATE POLICY "pages_service_role_all" ON pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
