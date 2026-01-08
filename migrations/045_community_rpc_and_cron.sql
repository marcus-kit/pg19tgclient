-- 045_community_rpc_and_cron.sql
-- RPC функция для отправки сообщений + pg_cron для автоматической очистки

-- ============================================
-- 0. Восстановление unique constraint (потерян при UUID миграции)
-- ============================================
-- Необходим для ON CONFLICT в upsert membership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'community_members_room_user_unique'
      AND table_name = 'community_members'
  ) THEN
    ALTER TABLE community_members
    ADD CONSTRAINT community_members_room_user_unique
    UNIQUE (room_id, user_id);
  END IF;
END $$;

-- ============================================
-- 1. RPC функция send_community_message
-- ============================================
-- Объединяет 6-7 запросов в один вызов:
-- - Проверка комнаты
-- - Проверка адреса аккаунта
-- - Проверка бана
-- - Проверка мута
-- - Вставка сообщения
-- - Upsert membership

CREATE OR REPLACE FUNCTION public.send_community_message(
  p_user_id UUID,
  p_account_id UUID,
  p_room_id UUID,
  p_content TEXT,
  p_content_type TEXT DEFAULT 'text',
  p_image_url TEXT DEFAULT NULL,
  p_image_width INTEGER DEFAULT NULL,
  p_image_height INTEGER DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_account RECORD;
  v_ban RECORD;
  v_mute RECORD;
  v_message RECORD;
  v_user RECORD;
BEGIN
  -- 1. Получить комнату
  SELECT id, city, district, building, is_active
  INTO v_room
  FROM community_rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RETURN json_build_object('error', 'room_not_found', 'message', 'Комната не найдена');
  END IF;

  IF NOT v_room.is_active THEN
    RETURN json_build_object('error', 'room_inactive', 'message', 'Комната неактивна');
  END IF;

  -- 2. Получить аккаунт
  SELECT id, address_city, address_district, address_building
  INTO v_account
  FROM accounts
  WHERE id = p_account_id;

  IF v_account IS NULL THEN
    RETURN json_build_object('error', 'account_not_found', 'message', 'Аккаунт не найден');
  END IF;

  -- 3. Проверка географии
  IF v_account.address_city IS DISTINCT FROM v_room.city THEN
    RETURN json_build_object('error', 'access_denied', 'message', 'Нет доступа к этой комнате (город)');
  END IF;

  IF v_room.district IS NOT NULL AND v_account.address_district IS DISTINCT FROM v_room.district THEN
    RETURN json_build_object('error', 'access_denied', 'message', 'Нет доступа к этой комнате (район)');
  END IF;

  IF v_room.building IS NOT NULL AND v_account.address_building IS DISTINCT FROM v_room.building THEN
    RETURN json_build_object('error', 'access_denied', 'message', 'Нет доступа к этой комнате (дом)');
  END IF;

  -- 4. Проверка бана
  SELECT id INTO v_ban
  FROM community_bans
  WHERE room_id = p_room_id
    AND user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_ban IS NOT NULL THEN
    RETURN json_build_object('error', 'banned', 'message', 'Вы заблокированы в этом чате');
  END IF;

  -- 5. Проверка мута (колонка expires_at)
  SELECT id, expires_at INTO v_mute
  FROM community_mutes
  WHERE room_id = p_room_id
    AND user_id = p_user_id
    AND expires_at > now()
  LIMIT 1;

  IF v_mute IS NOT NULL THEN
    RETURN json_build_object(
      'error', 'muted',
      'message', 'Вы не можете писать',
      'muted_until', v_mute.expires_at
    );
  END IF;

  -- 6. Вставка сообщения
  INSERT INTO community_messages (
    room_id,
    user_id,
    content,
    content_type,
    image_url,
    image_width,
    image_height,
    reply_to_id
  ) VALUES (
    p_room_id,
    p_user_id,
    COALESCE(TRIM(p_content), ''),
    p_content_type::community_content_type,
    p_image_url,
    p_image_width,
    p_image_height,
    p_reply_to_id
  )
  RETURNING * INTO v_message;

  -- 7. Получить данные пользователя для ответа
  SELECT id, first_name, last_name, avatar
  INTO v_user
  FROM users
  WHERE id = p_user_id;

  -- 8. Upsert в members
  INSERT INTO community_members (room_id, user_id, account_id, last_read_at)
  VALUES (p_room_id, p_user_id, p_account_id, now())
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    last_read_at = now();

  -- 9. Вернуть успешный результат
  RETURN json_build_object(
    'success', true,
    'message', json_build_object(
      'id', v_message.id,
      'room_id', v_message.room_id,
      'user_id', v_message.user_id,
      'content', v_message.content,
      'content_type', v_message.content_type,
      'image_url', v_message.image_url,
      'image_width', v_message.image_width,
      'image_height', v_message.image_height,
      'is_pinned', v_message.is_pinned,
      'is_deleted', v_message.is_deleted,
      'deleted_at', v_message.deleted_at,
      'deleted_by', v_message.deleted_by,
      'reply_to_id', v_message.reply_to_id,
      'created_at', v_message.created_at,
      'updated_at', v_message.updated_at,
      'user', json_build_object(
        'id', v_user.id,
        'first_name', v_user.first_name,
        'last_name', v_user.last_name,
        'avatar', v_user.avatar
      )
    )
  );
END;
$$;

COMMENT ON FUNCTION public.send_community_message IS
'Отправка сообщения в комнату с проверкой доступа, бана и мута. Возвращает JSON с success/error.';

-- ============================================
-- 2. pg_cron для автоматической очистки
-- ============================================

-- Включаем pg_cron (если ещё не включён)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Даём права на выполнение cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;

-- 2.1. Очистка истёкших мутов (каждый час)
SELECT cron.schedule(
  'cleanup-expired-mutes',
  '0 * * * *',  -- Каждый час в :00
  $$DELETE FROM public.community_mutes WHERE expires_at < now()$$
);

-- 2.2. Очистка истёкших банов (каждый час)
SELECT cron.schedule(
  'cleanup-expired-bans',
  '5 * * * *',  -- Каждый час в :05
  $$DELETE FROM public.community_bans WHERE expires_at IS NOT NULL AND expires_at < now()$$
);

-- 2.3. Обновление offline статуса (каждые 5 минут)
SELECT cron.schedule(
  'update-offline-status',
  '*/5 * * * *',  -- Каждые 5 минут
  $$UPDATE public.users SET online_status = 'offline' WHERE online_status = 'online' AND last_seen_at < now() - interval '2 minutes'$$
);

-- 2.4. Очистка старых resolved репортов (раз в день)
SELECT cron.schedule(
  'cleanup-old-reports',
  '0 4 * * *',  -- Каждый день в 4:00
  $$DELETE FROM public.community_reports WHERE status IN ('resolved', 'dismissed') AND created_at < now() - interval '30 days'$$
);

-- 2.5. Soft-delete очистка (архивация удалённых сообщений старше 90 дней)
-- Сначала создаём архивную таблицу если её нет
CREATE TABLE IF NOT EXISTS public.community_messages_archive (
  LIKE public.community_messages INCLUDING ALL
);

COMMENT ON TABLE public.community_messages_archive IS 'Архив удалённых сообщений старше 90 дней';

SELECT cron.schedule(
  'archive-deleted-messages',
  '0 3 * * *',  -- Каждый день в 3:00
  $$
  WITH archived AS (
    INSERT INTO public.community_messages_archive
    SELECT * FROM public.community_messages
    WHERE is_deleted = true AND deleted_at < now() - interval '90 days'
    RETURNING id
  )
  DELETE FROM public.community_messages WHERE id IN (SELECT id FROM archived)
  $$
);

-- ============================================
-- 3. Вспомогательная функция для rate limiting (опционально)
-- ============================================
-- Можно использовать вместо in-memory rate limiter

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Upsert with atomic increment
  INSERT INTO rate_limits (key, count, window_start, expires_at)
  VALUES (
    p_key,
    1,
    now(),
    now() + (p_window_seconds * 2 || ' seconds')::interval
  )
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN now()
      ELSE rate_limits.window_start
    END,
    expires_at = now() + (p_window_seconds * 2 || ' seconds')::interval
  RETURNING * INTO v_record;

  RETURN v_record.count <= p_limit;
END;
$$;

COMMENT ON FUNCTION public.check_rate_limit IS
'Проверка rate limit. Возвращает true если в пределах лимита.';

-- Добавляем cron для очистки rate_limits
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/10 * * * *',  -- Каждые 10 минут
  $$DELETE FROM public.rate_limits WHERE expires_at < now()$$
);

-- ============================================
-- 4. Проверка созданных jobs
-- ============================================
-- SELECT * FROM cron.job;
