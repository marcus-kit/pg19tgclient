-- Migration: 025_community_chat.sql
-- Общий чат для клиентов с иерархией город → улица → дом

-- Уровни комнат
CREATE TYPE public.community_room_level AS ENUM ('city', 'street', 'building');

-- Типы контента
CREATE TYPE public.community_content_type AS ENUM ('text', 'image', 'system');

-- Роли участников
CREATE TYPE public.community_member_role AS ENUM ('member', 'moderator', 'admin');

-- =====================================================
-- Таблица комнат
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_rooms (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Иерархия
  level public.community_room_level NOT NULL,
  parent_id bigint REFERENCES public.community_rooms(id) ON DELETE SET NULL,

  -- Географические ключи (для быстрого поиска)
  city text NOT NULL,
  street text,           -- NULL для level='city'
  building text,         -- NULL для level='city' или 'street'

  -- Метаданные
  name text NOT NULL,    -- "Ростов-на-Дону" или "ул. Пушкина" или "д. 10"
  description text,
  avatar_url text,

  -- Счётчики (денормализация для производительности)
  members_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,

  -- Статус
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Уникальность по географии
CREATE UNIQUE INDEX idx_community_rooms_geo
  ON public.community_rooms(city, COALESCE(street, ''), COALESCE(building, ''));

-- Индексы для быстрого поиска
CREATE INDEX idx_community_rooms_parent ON public.community_rooms(parent_id);
CREATE INDEX idx_community_rooms_level ON public.community_rooms(level);
CREATE INDEX idx_community_rooms_city ON public.community_rooms(city);
CREATE INDEX idx_community_rooms_active ON public.community_rooms(is_active) WHERE is_active = true;

-- =====================================================
-- Таблица участников
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_id bigint NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id bigint NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- Роль в комнате
  role public.community_member_role DEFAULT 'member',

  -- Настройки
  notifications_enabled boolean DEFAULT true,
  last_read_at timestamptz,

  -- Timestamps
  joined_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_community_members_room ON public.community_members(room_id);
CREATE INDEX idx_community_members_user ON public.community_members(user_id);

-- =====================================================
-- Таблица сообщений
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_id bigint NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id),

  -- Контент
  content text NOT NULL,
  content_type public.community_content_type DEFAULT 'text',

  -- Для изображений
  image_url text,
  image_width integer,
  image_height integer,

  -- Модерация
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by bigint REFERENCES public.users(id),

  -- Ответ на сообщение
  reply_to_id bigint REFERENCES public.community_messages(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_messages_room ON public.community_messages(room_id);
CREATE INDEX idx_community_messages_user ON public.community_messages(user_id);
CREATE INDEX idx_community_messages_created ON public.community_messages(room_id, created_at DESC);
CREATE INDEX idx_community_messages_pinned ON public.community_messages(room_id) WHERE is_pinned = true;
CREATE INDEX idx_community_messages_active ON public.community_messages(room_id, created_at DESC) WHERE is_deleted = false;

-- =====================================================
-- Таблица банов
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_bans (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_id bigint NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Кто забанил
  banned_by bigint NOT NULL REFERENCES public.users(id),

  -- Причина и срок
  reason text,
  expires_at timestamptz,  -- NULL = перманентный

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_community_bans_room ON public.community_bans(room_id);
CREATE INDEX idx_community_bans_user ON public.community_bans(user_id);
-- Индекс для поиска активных банов (без предиката, т.к. now() не IMMUTABLE)
CREATE INDEX idx_community_bans_active ON public.community_bans(room_id, user_id, expires_at);

-- =====================================================
-- RLS политики
-- =====================================================
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bans ENABLE ROW LEVEL SECURITY;

-- Политики для community_rooms
DROP POLICY IF EXISTS "Active rooms are viewable by authenticated" ON public.community_rooms;
CREATE POLICY "Active rooms are viewable by authenticated"
  ON public.community_rooms FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to rooms" ON public.community_rooms;
CREATE POLICY "Service role full access to rooms"
  ON public.community_rooms FOR ALL
  TO service_role
  USING (true);

-- Политики для community_members
DROP POLICY IF EXISTS "Members can view room members" ON public.community_members;
CREATE POLICY "Members can view room members"
  ON public.community_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to members" ON public.community_members;
CREATE POLICY "Service role full access to members"
  ON public.community_members FOR ALL
  TO service_role
  USING (true);

-- Политики для community_messages
DROP POLICY IF EXISTS "Members can view messages" ON public.community_messages;
CREATE POLICY "Members can view messages"
  ON public.community_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to messages" ON public.community_messages;
CREATE POLICY "Service role full access to messages"
  ON public.community_messages FOR ALL
  TO service_role
  USING (true);

-- Политики для community_bans
DROP POLICY IF EXISTS "Service role full access to bans" ON public.community_bans;
CREATE POLICY "Service role full access to bans"
  ON public.community_bans FOR ALL
  TO service_role
  USING (true);

-- =====================================================
-- Функции
-- =====================================================

-- Функция для автоматического создания комнат по адресу
CREATE OR REPLACE FUNCTION public.ensure_community_rooms(
  p_city text,
  p_street text DEFAULT NULL,
  p_building text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_city_room_id bigint;
  v_street_room_id bigint;
BEGIN
  -- Создаём/получаем комнату города
  INSERT INTO public.community_rooms (level, city, name)
  VALUES ('city', p_city, p_city)
  ON CONFLICT (city, COALESCE(street, ''), COALESCE(building, ''))
  DO NOTHING
  RETURNING id INTO v_city_room_id;

  IF v_city_room_id IS NULL THEN
    SELECT id INTO v_city_room_id FROM public.community_rooms
    WHERE city = p_city AND street IS NULL AND building IS NULL;
  END IF;

  -- Создаём/получаем комнату улицы
  IF p_street IS NOT NULL AND p_street != '' THEN
    INSERT INTO public.community_rooms (level, parent_id, city, street, name)
    VALUES ('street', v_city_room_id, p_city, p_street, p_street)
    ON CONFLICT (city, COALESCE(street, ''), COALESCE(building, ''))
    DO NOTHING
    RETURNING id INTO v_street_room_id;

    IF v_street_room_id IS NULL THEN
      SELECT id INTO v_street_room_id FROM public.community_rooms
      WHERE city = p_city AND street = p_street AND building IS NULL;
    END IF;

    -- Создаём/получаем комнату дома
    IF p_building IS NOT NULL AND p_building != '' THEN
      INSERT INTO public.community_rooms (level, parent_id, city, street, building, name)
      VALUES ('building', v_street_room_id, p_city, p_street, p_building, 'д. ' || p_building)
      ON CONFLICT (city, COALESCE(street, ''), COALESCE(building, ''))
      DO NOTHING;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция обновления счётчика сообщений
CREATE OR REPLACE FUNCTION public.update_community_room_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_rooms
    SET messages_count = messages_count + 1,
        updated_at = now()
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_rooms
    SET messages_count = GREATEST(messages_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления счётчика участников
CREATE OR REPLACE FUNCTION public.update_community_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_rooms
    SET members_count = members_count + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_rooms
    SET members_count = GREATEST(members_count - 1, 0)
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_community_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Триггеры
-- =====================================================

DROP TRIGGER IF EXISTS update_community_room_message_count ON public.community_messages;
CREATE TRIGGER update_community_room_message_count
  AFTER INSERT OR DELETE ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_room_message_count();

DROP TRIGGER IF EXISTS update_community_room_member_count ON public.community_members;
CREATE TRIGGER update_community_room_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_room_member_count();

DROP TRIGGER IF EXISTS update_community_rooms_timestamp ON public.community_rooms;
CREATE TRIGGER update_community_rooms_timestamp
  BEFORE UPDATE ON public.community_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_timestamp();

DROP TRIGGER IF EXISTS update_community_messages_timestamp ON public.community_messages;
CREATE TRIGGER update_community_messages_timestamp
  BEFORE UPDATE ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_timestamp();

-- =====================================================
-- Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- =====================================================
-- Storage bucket для изображений
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Политика: загрузка только для авторизованных
DROP POLICY IF EXISTS "Authenticated can upload community images" ON storage.objects;
CREATE POLICY "Authenticated can upload community images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Политика: публичное чтение
DROP POLICY IF EXISTS "Public can read community images" ON storage.objects;
CREATE POLICY "Public can read community images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- =====================================================
-- Комментарии
-- =====================================================
COMMENT ON TABLE public.community_rooms IS 'Комнаты общего чата (город/улица/дом)';
COMMENT ON TABLE public.community_members IS 'Участники комнат';
COMMENT ON TABLE public.community_messages IS 'Сообщения в комнатах';
COMMENT ON TABLE public.community_bans IS 'Баны пользователей в комнатах';

COMMENT ON COLUMN public.community_rooms.level IS 'Уровень: city, street, building';
COMMENT ON COLUMN public.community_messages.content_type IS 'Тип: text, image, system';
COMMENT ON COLUMN public.community_members.role IS 'Роль: member, moderator, admin';
COMMENT ON COLUMN public.community_bans.expires_at IS 'NULL = перманентный бан';

COMMENT ON FUNCTION public.ensure_community_rooms IS 'Автоматически создаёт комнаты для города/улицы/дома';
