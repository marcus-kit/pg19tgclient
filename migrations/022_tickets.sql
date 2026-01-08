-- Migration: 022_tickets.sql
-- Description: Система тикетов поддержки
-- Created: 2026-01-08

-- ============================================
-- ENUM TYPES для тикетов
-- ============================================

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'technical',      -- Технические проблемы
    'billing',        -- Вопросы оплаты
    'connection',     -- Подключение
    'tariff',         -- Смена тарифа
    'equipment',      -- Оборудование
    'other'           -- Прочее
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'new',            -- Новый (не просмотрен)
    'open',           -- Открыт (в работе)
    'pending',        -- Ожидает ответа пользователя
    'resolved',       -- Решён
    'closed'          -- Закрыт
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM (
    'low',            -- Низкий
    'normal',         -- Обычный
    'high',           -- Высокий
    'urgent'          -- Срочный
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: tickets
-- Тикеты поддержки
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  user_telegram_id BIGINT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'other',
  status ticket_status NOT NULL DEFAULT 'new',
  priority ticket_priority NOT NULL DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  related_service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  related_subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE tickets IS 'Тикеты техподдержки';
COMMENT ON COLUMN tickets.number IS 'Номер тикета в формате TKT-YYYY-NNNN';
COMMENT ON COLUMN tickets.first_response_at IS 'Время первого ответа от поддержки (для SLA)';
COMMENT ON COLUMN tickets.sla_deadline IS 'Крайний срок ответа по SLA';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin_id ON tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(number);

-- ============================================
-- TABLE: ticket_comments
-- Комментарии к тикетам
-- ============================================

CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'admin', 'system')),
  author_id TEXT NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

-- Комментарии
COMMENT ON TABLE ticket_comments IS 'Комментарии к тикетам';
COMMENT ON COLUMN ticket_comments.is_internal IS 'Внутренний комментарий (не виден пользователю)';
COMMENT ON COLUMN ticket_comments.is_solution IS 'Отмечен как решение проблемы';
COMMENT ON COLUMN ticket_comments.attachments IS 'Массив вложений [{name, url, size, mime_type}]';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

-- ============================================
-- TABLE: ticket_history
-- История изменений тикетов
-- ============================================

CREATE TABLE IF NOT EXISTS ticket_history (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE ticket_history IS 'История изменений тикетов';
COMMENT ON COLUMN ticket_history.action IS 'Тип действия: status_change, priority_change, assign, etc.';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history(created_at);

-- ============================================
-- Триггеры
-- ============================================

-- Триггер для обновления updated_at в tickets
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Функция для генерации номера тикета
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(number FROM 'TKT-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM tickets
  WHERE number LIKE 'TKT-' || year_part || '-%';

  NEW.number := 'TKT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.number IS NULL OR NEW.number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- ============================================
-- RLS политики
-- ============================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Tickets: Service role полный доступ
CREATE POLICY "tickets_service_role_all" ON tickets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ticket comments: Service role полный доступ
CREATE POLICY "ticket_comments_service_role_all" ON ticket_comments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ticket history: Service role полный доступ
CREATE POLICY "ticket_history_service_role_all" ON ticket_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Realtime для уведомлений
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_comments;
