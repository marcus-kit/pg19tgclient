-- Migration: 014_chat_system.sql
-- Онлайн-чат с поддержкой Supabase Realtime

-- Сессии чата
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Связь с пользователем (NULL для гостей)
  user_id bigint REFERENCES public.users(id),
  account_id bigint REFERENCES public.accounts(id),

  -- Гостевые данные
  guest_name text,
  guest_contact text,  -- телефон или email

  -- Статус сессии
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Активный чат (с AI ботом)
    'waiting',     -- Ожидает оператора
    'processing',  -- Оператор взял в работу
    'closed',      -- Закрыт
    'resolved'     -- Решён
  )),

  -- Метаданные
  assigned_to bigint REFERENCES public.users(id),  -- Назначенный оператор
  last_message_at timestamptz,
  unread_count integer DEFAULT 0,

  -- AI контекст
  ai_summary text,  -- Краткое содержание от AI

  -- Источник
  source text DEFAULT 'website',  -- website, telegram, mobile

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Сообщения чата
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  session_id bigint NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,

  -- Отправитель
  sender_type text NOT NULL CHECK (sender_type IN (
    'user',     -- Пользователь/гость
    'bot',      -- AI бот
    'operator'  -- Оператор поддержки
  )),
  sender_id bigint REFERENCES public.users(id),  -- NULL для гостей и бота

  -- Контент
  message text NOT NULL,

  -- Метаданные
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status
  ON public.chat_sessions(status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
  ON public.chat_sessions(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_operator
  ON public.chat_sessions(assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON public.chat_messages(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON public.chat_messages(session_id, is_read)
  WHERE is_read = false;

-- RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Политики для chat_sessions
DROP POLICY IF EXISTS "Anyone can create chat session" ON public.chat_sessions;
CREATE POLICY "Anyone can create chat session"
  ON public.chat_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to chat_sessions" ON public.chat_sessions;
CREATE POLICY "Service role full access to chat_sessions"
  ON public.chat_sessions FOR ALL
  TO service_role
  USING (true);

-- Политики для chat_messages
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
CREATE POLICY "Anyone can send messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view messages in own sessions" ON public.chat_messages;
CREATE POLICY "Users can view messages in own sessions"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE user_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access to chat_messages" ON public.chat_messages;
CREATE POLICY "Service role full access to chat_messages"
  ON public.chat_messages FOR ALL
  TO service_role
  USING (true);

-- Включить Realtime для таблиц
-- ВАЖНО: Это нужно для работы подписок на изменения
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_timestamp ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_timestamp
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();

-- Комментарии
COMMENT ON TABLE public.chat_sessions IS 'Сессии онлайн-чата с поддержкой';
COMMENT ON TABLE public.chat_messages IS 'Сообщения в чате';
COMMENT ON COLUMN public.chat_sessions.status IS 'Статус: active (с AI), waiting, processing, closed, resolved';
COMMENT ON COLUMN public.chat_sessions.ai_summary IS 'Краткое содержание беседы от AI для операторов';
COMMENT ON COLUMN public.chat_messages.sender_type IS 'Тип отправителя: user, bot, operator';
