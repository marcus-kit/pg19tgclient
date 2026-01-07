-- Migration: 009_extend_auth_sessions.sql
-- Расширение таблицы auth_sessions для отслеживания устройств

ALTER TABLE public.auth_sessions
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
  ON public.auth_sessions(user_id, last_active_at DESC)
  WHERE terminated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_current
  ON public.auth_sessions(user_id, is_current)
  WHERE is_current = true;

COMMENT ON COLUMN public.auth_sessions.device_type IS 'Тип устройства: desktop, mobile, tablet';
COMMENT ON COLUMN public.auth_sessions.browser IS 'Браузер (Chrome, Safari, Firefox)';
COMMENT ON COLUMN public.auth_sessions.os IS 'Операционная система';
COMMENT ON COLUMN public.auth_sessions.ip_address IS 'IP адрес (маскированный)';
COMMENT ON COLUMN public.auth_sessions.location IS 'Геолокация по IP';
COMMENT ON COLUMN public.auth_sessions.last_active_at IS 'Последняя активность';
COMMENT ON COLUMN public.auth_sessions.is_current IS 'Текущая сессия';
COMMENT ON COLUMN public.auth_sessions.terminated_at IS 'Время завершения сессии';
