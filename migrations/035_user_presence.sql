-- User Presence: добавляем поля для отслеживания онлайн-статуса
-- online_status: 'online' | 'away' | 'offline'
-- last_seen_at: время последней активности

-- Добавляем поля в таблицу users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS online_status text DEFAULT 'offline'
    CHECK (online_status IN ('online', 'away', 'offline'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- Индекс для быстрого поиска онлайн пользователей
CREATE INDEX IF NOT EXISTS idx_users_online_status
  ON public.users(online_status)
  WHERE online_status = 'online';

-- Индекс для сортировки по последней активности
CREATE INDEX IF NOT EXISTS idx_users_last_seen
  ON public.users(last_seen_at DESC);

-- Функция для автоматического обновления last_seen_at при изменении статуса
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.online_status IS DISTINCT FROM OLD.online_status THEN
    NEW.last_seen_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на обновление
DROP TRIGGER IF EXISTS trigger_user_last_seen ON public.users;
CREATE TRIGGER trigger_user_last_seen
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();

-- Функция для пакетного обновления офлайн пользователей (для cron job)
-- Помечает как offline тех, кто не был активен более 5 минут
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS integer AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE public.users
  SET online_status = 'offline'
  WHERE online_status IN ('online', 'away')
    AND last_seen_at < now() - interval '5 minutes';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON COLUMN public.users.online_status IS 'Статус присутствия: online, away, offline';
COMMENT ON COLUMN public.users.last_seen_at IS 'Время последней активности пользователя';
COMMENT ON FUNCTION mark_inactive_users_offline() IS 'Вызывать через cron каждые 1-5 минут для очистки неактивных';
