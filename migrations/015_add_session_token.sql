-- Migration: 015_add_session_token.sql
-- Добавление токена сессии для серверной авторизации

-- Добавляем колонку для токена сессии
ALTER TABLE public.auth_sessions
  ADD COLUMN IF NOT EXISTS session_token text;

-- Создаём уникальный индекс для быстрого поиска по токену
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token
  ON public.auth_sessions(session_token)
  WHERE session_token IS NOT NULL;

-- Индекс для поиска активных сессий по токену
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_active
  ON public.auth_sessions(session_token)
  WHERE session_token IS NOT NULL
    AND verified = true
    AND expires_at > now();

COMMENT ON COLUMN public.auth_sessions.session_token IS 'Криптографически безопасный токен для авторизации API запросов';
