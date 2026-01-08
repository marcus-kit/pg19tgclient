-- 044_community_performance.sql
-- Индексы для оптимизации производительности community chat

-- Ускорение подсчёта непрочитанных сообщений
-- Используется при получении списка комнат с unread_count
CREATE INDEX IF NOT EXISTS idx_community_members_last_read
  ON public.community_members(user_id, room_id, last_read_at);

-- Ускорение поиска reply-to сообщений
-- Используется при batch-загрузке сообщений, на которые ссылаются другие
CREATE INDEX IF NOT EXISTS idx_community_messages_reply
  ON public.community_messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- Ускорение поиска пользователей по онлайн статусу
-- Используется для отображения онлайн пользователей в комнате
CREATE INDEX IF NOT EXISTS idx_users_online_status
  ON public.users(online_status)
  WHERE online_status = 'online';

-- Составной индекс для быстрого получения последних сообщений комнаты
-- Оптимизирует ORDER BY id DESC с фильтром по room_id
CREATE INDEX IF NOT EXISTS idx_community_messages_room_id_desc_v2
  ON public.community_messages(room_id, id DESC)
  WHERE is_deleted = false;

-- Индекс для ускорения поиска сообщений по user_id в комнате
-- Полезен для модерации и истории сообщений пользователя
CREATE INDEX IF NOT EXISTS idx_community_messages_room_user
  ON public.community_messages(room_id, user_id, created_at DESC);

COMMENT ON INDEX idx_community_members_last_read IS 'Ускоряет подсчёт непрочитанных сообщений';
COMMENT ON INDEX idx_community_messages_reply IS 'Ускоряет batch-загрузку reply-to сообщений';
COMMENT ON INDEX idx_users_online_status IS 'Ускоряет поиск онлайн пользователей';
COMMENT ON INDEX idx_community_messages_room_id_desc_v2 IS 'Ускоряет пагинацию сообщений';
COMMENT ON INDEX idx_community_messages_room_user IS 'Ускоряет поиск сообщений пользователя в комнате';
