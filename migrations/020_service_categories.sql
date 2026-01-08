-- Migration: 020_service_categories.sql
-- Description: Категории услуг
-- Created: 2026-01-08

-- ============================================
-- TABLE: service_categories
-- Категории для группировки услуг
-- ============================================

CREATE TABLE IF NOT EXISTS service_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE service_categories IS 'Категории услуг (Интернет, Телевидение, Доп. услуги)';
COMMENT ON COLUMN service_categories.icon IS 'Иконка категории (название heroicon или URL)';
COMMENT ON COLUMN service_categories.slug IS 'URL-friendly идентификатор';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_categories_sort_order ON service_categories(sort_order);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_categories_updated_at ON service_categories;
CREATE TRIGGER trigger_update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

-- RLS политики
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения активных категорий
CREATE POLICY "service_categories_public_read" ON service_categories
  FOR SELECT
  USING (is_active = true);

-- Service role имеет полный доступ
CREATE POLICY "service_categories_service_role_all" ON service_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
