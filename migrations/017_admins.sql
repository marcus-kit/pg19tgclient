-- Migration: 017_admins.sql
-- Description: Администраторы для админ-панели
-- Created: 2026-01-08

-- ============================================
-- TABLE: admins
-- Администраторы системы с Supabase Auth интеграцией
-- ============================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator', 'support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии к столбцам
COMMENT ON TABLE admins IS 'Администраторы для панели управления';
COMMENT ON COLUMN admins.role IS 'admin = полный доступ, moderator = ограниченный, support = только чат';
COMMENT ON COLUMN admins.permissions IS 'Детальные права доступа (JSON)';
COMMENT ON COLUMN admins.auth_user_id IS 'Связь с Supabase Auth для авторизации';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admins_updated_at ON admins;
CREATE TRIGGER trigger_update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();

-- RLS политики
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Только service_role может читать и изменять админов
CREATE POLICY "admins_service_role_all" ON admins
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Админ может читать свою запись через auth.uid()
CREATE POLICY "admins_read_own" ON admins
  FOR SELECT
  USING (auth.uid() = auth_user_id);
