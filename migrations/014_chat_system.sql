-- Migration: 014_chat_system.sql
-- Онлайн-чат с поддержкой Supabase Realtime

-- Таблица чатов
CREATE TABLE IF NOT EXISTS public.chats (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Связь с пользователем (NULL для гостей)
  user_id bigint REFERENCES public.users(id),
  account_id bigint REFERENCES public.accounts(id),
  user_name text,  -- Имя пользователя (кэш для отображения)

  -- Гостевые данные
  guest_name text,
  guest_contact text,  -- телефон или email

  -- Статус чата
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Активный чат
    'waiting',     -- Ожидает оператора
    'processing',  -- Оператор взял в работу
    'closed',      -- Закрыт
    'resolved'     -- Решён
  )),

  -- Метаданные
  assigned_to bigint REFERENCES public.users(id),  -- Назначенный оператор
  last_message_at timestamptz,
  unread_admin_count integer DEFAULT 0,  -- Непрочитанные для админа
  unread_user_count integer DEFAULT 0,   -- Непрочитанные для пользователя

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

  chat_id bigint NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,

  -- Отправитель
  sender_type text NOT NULL CHECK (sender_type IN (
    'user',     -- Пользователь/гость
    'admin',    -- Оператор поддержки
    'system'    -- Системное сообщение
  )),
  sender_id bigint REFERENCES public.users(id),  -- NULL для гостей
  sender_name text,  -- Имя отправителя для отображения

  -- Контент
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',  -- text, image, file

  -- Метаданные
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chats_status
  ON public.chats(status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chats_user
  ON public.chats(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chats_operator
  ON public.chats(assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat
  ON public.chat_messages(chat_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON public.chat_messages(chat_id, is_read)
  WHERE is_read = false;

-- RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Политики для chats
DROP POLICY IF EXISTS "Anyone can create chat" ON public.chats;
CREATE POLICY "Anyone can create chat"
  ON public.chats FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to chats" ON public.chats;
CREATE POLICY "Service role full access to chats"
  ON public.chats FOR ALL
  TO service_role
  USING (true);

-- Политики для chat_messages
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
CREATE POLICY "Anyone can send messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.chat_messages;
CREATE POLICY "Users can view messages in own chats"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM public.chats
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chats_timestamp ON public.chats;
CREATE TRIGGER update_chats_timestamp
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Комментарии
COMMENT ON TABLE public.chats IS 'Чаты с поддержкой';
COMMENT ON TABLE public.chat_messages IS 'Сообщения в чате';
COMMENT ON COLUMN public.chats.status IS 'Статус: active, waiting, processing, closed, resolved';
COMMENT ON COLUMN public.chats.ai_summary IS 'Краткое содержание беседы от AI для операторов';
COMMENT ON COLUMN public.chat_messages.sender_type IS 'Тип отправителя: user, admin, system';
