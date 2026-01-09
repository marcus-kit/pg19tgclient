-- Migration: Community Chat Notifications
-- Уведомления о новых сообщениях в чатах через Telegram Bot API

-- 1. Добавляем настройку уведомлений в users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS community_notifications BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.users.community_notifications IS 'Включены ли уведомления о сообщениях в community чатах';

-- 2. Добавляем настройку уведомлений в community_members (per-room)
ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.community_members.notifications_enabled IS 'Включены ли уведомления для этой комнаты';

-- 3. RPC для получения офлайн-пользователей комнаты
CREATE OR REPLACE FUNCTION get_offline_room_members(
  p_room_id UUID,
  p_sender_id UUID
)
RETURNS TABLE (
  user_id UUID,
  telegram_id TEXT,
  first_name TEXT,
  last_name TEXT
) AS $$
DECLARE
  v_offline_threshold TIMESTAMPTZ := now() - interval '1 minute';
BEGIN
  RETURN QUERY
  SELECT
    cm.user_id,
    u.telegram_id,
    u.first_name,
    u.last_name
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
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_offline_room_members IS 'Возвращает пользователей комнаты, которые офлайн и могут получить уведомление';
