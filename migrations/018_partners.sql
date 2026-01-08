-- Migration: 018_partners.sql
-- Description: Партнёры (монтажные организации)
-- Created: 2026-01-08

-- ============================================
-- TABLE: partners
-- Партнёрские организации с двойной авторизацией
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  inn TEXT NOT NULL,
  kpp TEXT,
  ogrn TEXT,
  legal_address TEXT NOT NULL,
  contact_person_name TEXT,
  contact_person_position TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  verified_at TIMESTAMPTZ,
  commission_rate_percent NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Дополнительные поля для прямой авторизации партнёра
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  phone TEXT,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE partners IS 'Партнёрские организации (монтажники, дилеры)';
COMMENT ON COLUMN partners.user_id IS 'Связь с таблицей users (владелец аккаунта партнёра)';
COMMENT ON COLUMN partners.auth_user_id IS 'UUID from auth.users for Supabase Auth integration';
COMMENT ON COLUMN partners.commission_rate_percent IS 'Индивидуальная ставка комиссии для партнера';
COMMENT ON COLUMN partners.last_login_at IS 'Last login timestamp, updated on each login';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_auth_user_id ON partners(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_inn ON partners(inn);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active) WHERE is_active = true;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partners_updated_at ON partners;
CREATE TRIGGER trigger_update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- RLS политики
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Service role имеет полный доступ
CREATE POLICY "partners_service_role_all" ON partners
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Партнёр может читать свою запись
CREATE POLICY "partners_read_own" ON partners
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Публичный доступ к активным партнёрам (для отображения в списках)
CREATE POLICY "partners_public_read_active" ON partners
  FOR SELECT
  USING (is_active = true AND status = 'active');
