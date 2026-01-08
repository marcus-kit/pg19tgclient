-- Migration: 016_add_chat_session_token.sql
-- Добавление токена сессии для гостевых чатов

-- Добавляем колонку для токена сессии
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS session_token text;

-- Индекс для поиска чата по токену
CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_session_token
  ON public.chats(session_token)
  WHERE session_token IS NOT NULL;

COMMENT ON COLUMN public.chats.session_token IS 'Криптографический токен для авторизации гостевых чат-сессий';
