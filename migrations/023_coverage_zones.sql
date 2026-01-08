-- Migration: 023_coverage_zones.sql
-- Description: Общие зоны покрытия (независимо от партнёров)
-- Created: 2026-01-08

-- ============================================
-- ENUM TYPE для типов зон
-- ============================================

DO $$ BEGIN
  CREATE TYPE coverage_zone_type AS ENUM (
    'service',        -- Зона обслуживания
    'planned',        -- Планируемое расширение
    'limited',        -- Ограниченное покрытие
    'partner'         -- Партнёрская зона
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: coverage_zones
-- Общие зоны покрытия для отображения на карте
-- ============================================

CREATE TABLE IF NOT EXISTS coverage_zones (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type coverage_zone_type NOT NULL DEFAULT 'service',
  partner_id BIGINT REFERENCES partners(id) ON DELETE SET NULL,
  geometry JSONB NOT NULL,
  color TEXT NOT NULL DEFAULT '#F7941D',
  fill_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.3,
  stroke_width INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE coverage_zones IS 'Общие зоны покрытия для карты на сайте';
COMMENT ON COLUMN coverage_zones.geometry IS 'GeoJSON Polygon or MultiPolygon geometry';
COMMENT ON COLUMN coverage_zones.color IS 'Hex color for map display (e.g. #F7941D)';
COMMENT ON COLUMN coverage_zones.fill_opacity IS 'Fill opacity 0.0-1.0';
COMMENT ON COLUMN coverage_zones.stroke_width IS 'Border width in pixels';
COMMENT ON COLUMN coverage_zones.type IS 'Тип зоны: service (обслуживание), planned (планируется), limited (ограничено), partner (партнёр)';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_coverage_zones_type ON coverage_zones(type);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_partner_id ON coverage_zones(partner_id);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_is_active ON coverage_zones(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coverage_zones_sort_order ON coverage_zones(sort_order);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_coverage_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coverage_zones_updated_at ON coverage_zones;
CREATE TRIGGER trigger_update_coverage_zones_updated_at
  BEFORE UPDATE ON coverage_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_coverage_zones_updated_at();

-- RLS политики
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения активных зон
CREATE POLICY "coverage_zones_public_read" ON coverage_zones
  FOR SELECT
  USING (is_active = true);

-- Service role имеет полный доступ
CREATE POLICY "coverage_zones_service_role_all" ON coverage_zones
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
