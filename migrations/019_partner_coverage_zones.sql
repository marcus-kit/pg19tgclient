-- Migration: 019_partner_coverage_zones.sql
-- Description: Зоны покрытия партнёров с GeoJSON геометрией
-- Created: 2026-01-08

-- ============================================
-- TABLE: partner_coverage_zones
-- Зоны покрытия партнёров для проверки адресов
-- ============================================

CREATE TABLE IF NOT EXISTS partner_coverage_zones (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  geometry JSONB NOT NULL,
  bounds_north NUMERIC(10,7),
  bounds_south NUMERIC(10,7),
  bounds_east NUMERIC(10,7),
  bounds_west NUMERIC(10,7),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE partner_coverage_zones IS 'Зоны покрытия партнёров (полигоны на карте)';
COMMENT ON COLUMN partner_coverage_zones.geometry IS 'GeoJSON Polygon: {"type": "Polygon", "coordinates": [...]}';
COMMENT ON COLUMN partner_coverage_zones.bounds_north IS 'Северная граница bbox для быстрой фильтрации';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_partner_coverage_zones_partner_id ON partner_coverage_zones(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_coverage_zones_active ON partner_coverage_zones(active) WHERE active = true;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_partner_coverage_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_coverage_zones_updated_at ON partner_coverage_zones;
CREATE TRIGGER trigger_update_partner_coverage_zones_updated_at
  BEFORE UPDATE ON partner_coverage_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_coverage_zones_updated_at();

-- RLS политики
ALTER TABLE partner_coverage_zones ENABLE ROW LEVEL SECURITY;

-- Service role имеет полный доступ
CREATE POLICY "partner_coverage_zones_service_role_all" ON partner_coverage_zones
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Публичный доступ для чтения активных зон (проверка покрытия)
CREATE POLICY "partner_coverage_zones_public_read" ON partner_coverage_zones
  FOR SELECT
  USING (active = true);

-- Партнёр может управлять своими зонами
CREATE POLICY "partner_coverage_zones_partner_manage" ON partner_coverage_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_coverage_zones.partner_id
      AND partners.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_coverage_zones.partner_id
      AND partners.auth_user_id = auth.uid()
    )
  );
