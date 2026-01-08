-- 039_cleanup_chat_old_columns.sql
-- Очистка _old колонок из chat таблиц и пересоздание политик

-- ========================================
-- 1. Удалить _old колонки (уже удалены, но для идемпотентности)
-- ========================================

ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS chat_id_old CASCADE;
ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS sender_id_old CASCADE;

ALTER TABLE public.chats DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.chats DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- 2. Пересоздать политики для chat_messages
-- ========================================

DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to own chats" ON public.chat_messages;

CREATE POLICY "Users can view own chat messages"
ON public.chat_messages
FOR SELECT
USING (
  chat_id IN (
    SELECT id FROM chats
    WHERE user_telegram_id = ((current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint)
  )
);

CREATE POLICY "Users can send messages to own chats"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT id FROM chats
    WHERE user_telegram_id = ((current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint)
  )
  OR sender_type = 'user'
);

-- ========================================
-- 3. Пересоздать политику для chats (гости)
-- ========================================

DROP POLICY IF EXISTS "Guests can create chats" ON public.chats;

CREATE POLICY "Guests can create chats"
ON public.chats
FOR INSERT
WITH CHECK (true);

-- ========================================
-- 4. Сделать chat_id обязательным
-- ========================================

ALTER TABLE public.chat_messages ALTER COLUMN chat_id SET NOT NULL;
