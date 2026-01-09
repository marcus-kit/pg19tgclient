-- Migration: Community Notification Queue
-- Отложенные batch-уведомления о новых сообщениях в чатах
-- Задержка 1 минута + объединение нескольких сообщений в одно уведомление

-- 1. Таблица очереди уведомлений
CREATE TABLE IF NOT EXISTS public.community_notification_queue (
  -- Составной первичный ключ для дедупликации: один user + один room
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,

  -- Получатель (кешируем для избежания JOIN при отправке)
  telegram_chat_id TEXT NOT NULL,

  -- Агрегированные данные о сообщениях
  message_count INTEGER NOT NULL DEFAULT 1,
  room_name TEXT NOT NULL,

  -- Последние N отправителей (JSONB массив для формирования превью)
  -- Структура: [{"sender_name": "Иван", "preview": "Привет! Кто зна...", "content_type": "text"}, ...]
  message_previews JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Время отправки (now() + 1 min при создании)
  send_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, room_id)
);

-- Индекс для выборки записей готовых к отправке
-- Примечание: partial index с now() невозможен (now() не IMMUTABLE)
-- Используем обычный B-tree индекс - при небольшом объеме очереди разница минимальна
CREATE INDEX IF NOT EXISTS idx_notification_queue_send_at
  ON public.community_notification_queue(send_at);

-- Индекс для очистки старых записей
CREATE INDEX IF NOT EXISTS idx_notification_queue_created
  ON public.community_notification_queue(created_at);

COMMENT ON TABLE public.community_notification_queue IS
  'Очередь отложенных batch-уведомлений о новых сообщениях в community чате';
COMMENT ON COLUMN public.community_notification_queue.send_at IS
  'Время отправки уведомления (устанавливается как created_at + 1 minute при первом сообщении)';
COMMENT ON COLUMN public.community_notification_queue.message_previews IS
  'JSON массив последних 3 сообщений: [{sender_name, preview, content_type}]';

-- 2. Функция добавления уведомления в очередь
-- Вызывается из API при отправке сообщения
CREATE OR REPLACE FUNCTION queue_community_notification(
  p_room_id UUID,
  p_sender_id UUID,
  p_sender_name TEXT,
  p_message_preview TEXT,
  p_content_type TEXT DEFAULT 'text',
  p_room_name TEXT DEFAULT NULL
)
RETURNS INTEGER -- количество пользователей добавленных в очередь
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offline_threshold TIMESTAMPTZ := now() - interval '1 minute';
  v_delay INTERVAL := interval '1 minute';
  v_max_previews INTEGER := 3;
  v_queued_count INTEGER := 0;
  v_room_name TEXT;
  v_preview_json JSONB;
BEGIN
  -- Получаем имя комнаты если не передано
  IF p_room_name IS NULL THEN
    SELECT name INTO v_room_name
    FROM community_rooms
    WHERE id = p_room_id;
  ELSE
    v_room_name := p_room_name;
  END IF;

  -- Формируем JSON для превью (ограничиваем до 50 символов)
  v_preview_json := jsonb_build_object(
    'sender_name', p_sender_name,
    'preview', LEFT(p_message_preview, 50),
    'content_type', p_content_type
  );

  -- UPSERT для каждого офлайн-пользователя
  WITH offline_users AS (
    SELECT
      cm.user_id,
      u.telegram_id
    FROM community_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.room_id = p_room_id
      AND cm.user_id != p_sender_id
      -- Уведомления включены (глобально и для комнаты)
      AND COALESCE(u.community_notifications, true) = true
      AND COALESCE(cm.notifications_enabled, true) = true
      -- Есть Telegram ID для отправки
      AND u.telegram_id IS NOT NULL
      AND u.telegram_id != ''
      -- Офлайн условие: статус offline ИЛИ давно не заходил
      AND (
        u.online_status = 'offline'
        OR u.online_status IS NULL
        OR u.last_seen_at IS NULL
        OR u.last_seen_at < v_offline_threshold
      )
  ),
  upserted AS (
    INSERT INTO community_notification_queue (
      user_id,
      room_id,
      telegram_chat_id,
      room_name,
      message_count,
      message_previews,
      send_at,
      created_at,
      updated_at
    )
    SELECT
      ou.user_id,
      p_room_id,
      ou.telegram_id,
      v_room_name,
      1,
      jsonb_build_array(v_preview_json),
      now() + v_delay,  -- Отправить через 1 минуту
      now(),
      now()
    FROM offline_users ou
    ON CONFLICT (user_id, room_id) DO UPDATE SET
      message_count = community_notification_queue.message_count + 1,
      -- Добавляем новое превью в начало, ограничиваем до v_max_previews
      message_previews = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(
            v_preview_json || community_notification_queue.message_previews
          ) AS elem
          LIMIT v_max_previews
        ) sub
      ),
      updated_at = now()
      -- НЕ обновляем send_at - оставляем первоначальное время (1 мин с первого сообщения)
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_queued_count FROM upserted;

  RETURN v_queued_count;
END;
$$;

COMMENT ON FUNCTION queue_community_notification IS
  'Добавляет уведомление в очередь с дедупликацией по user+room. Возвращает количество затронутых записей.';

-- 3. Функция обработки очереди
-- Вызывается из Nitro task каждые 30 секунд
-- Возвращает записи готовые к отправке и удаляет их атомарно
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS TABLE (
  user_id UUID,
  telegram_chat_id TEXT,
  room_id UUID,
  room_name TEXT,
  message_count INTEGER,
  message_previews JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Атомарно выбираем и удаляем записи готовые к отправке
  RETURN QUERY
  WITH ready AS (
    SELECT q.*
    FROM community_notification_queue q
    WHERE q.send_at <= now()
    FOR UPDATE SKIP LOCKED  -- Для параллельной обработки если нужно
  ),
  deleted AS (
    DELETE FROM community_notification_queue
    WHERE (community_notification_queue.user_id, community_notification_queue.room_id)
      IN (SELECT r.user_id, r.room_id FROM ready r)
    RETURNING *
  )
  SELECT
    d.user_id,
    d.telegram_chat_id,
    d.room_id,
    d.room_name,
    d.message_count,
    d.message_previews
  FROM deleted d;
END;
$$;

COMMENT ON FUNCTION process_notification_queue IS
  'Извлекает и удаляет записи готовые к отправке (send_at <= now). Вызывается Nitro task каждые 30 сек.';

-- 4. Функция очистки старых записей (safety net)
-- Удаляет записи старше 10 минут (если что-то застряло)
CREATE OR REPLACE FUNCTION cleanup_stale_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM community_notification_queue
  WHERE created_at < now() - interval '10 minutes';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_stale_notifications IS
  'Удаляет застрявшие записи старше 10 минут. Вызывается pg_cron каждые 5 минут.';

-- 5. pg_cron job для очистки застрявших записей
-- (safety net, основная обработка через Nitro task)
SELECT cron.unschedule('cleanup-stale-community-notifications');

SELECT cron.schedule(
  'cleanup-stale-community-notifications',
  '*/5 * * * *',  -- Каждые 5 минут
  $$SELECT cleanup_stale_notifications()$$
);

COMMENT ON EXTENSION pg_cron IS 'pg_cron job: cleanup-stale-community-notifications каждые 5 мин';
