-- Migration: 027_street_to_district.sql
-- Замена "улица" → "район" в иерархии комнат чата
-- + Исправление бага с 99 непрочитанными сообщениями

-- =====================================================
-- 1. Добавить значение 'district' в enum
-- =====================================================
-- PostgreSQL не позволяет удалить значения из ENUM,
-- поэтому 'street' останется для совместимости
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'public.community_room_level'::regtype
        AND enumlabel = 'district'
    ) THEN
        ALTER TYPE public.community_room_level ADD VALUE 'district';
    END IF;
END
$$;

-- =====================================================
-- 2. Переименовать колонку street → district в community_rooms
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'community_rooms'
        AND column_name = 'street'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'community_rooms'
        AND column_name = 'district'
    ) THEN
        ALTER TABLE public.community_rooms RENAME COLUMN street TO district;
    END IF;
END
$$;

-- =====================================================
-- 3. Обновить все записи с level='street' на level='district'
-- =====================================================
UPDATE public.community_rooms
SET level = 'district'
WHERE level = 'street';

-- =====================================================
-- 4. Добавить колонку address_district в accounts
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'accounts'
        AND column_name = 'address_district'
    ) THEN
        ALTER TABLE public.accounts ADD COLUMN address_district text;
    END IF;
END
$$;

COMMENT ON COLUMN public.accounts.address_district IS 'Район для доступа к чату района';

-- Копируем address_street в address_district для существующих записей
UPDATE public.accounts
SET address_district = address_street
WHERE address_street IS NOT NULL
  AND (address_district IS NULL OR address_district = '');

-- =====================================================
-- 5. Обновить уникальный индекс
-- =====================================================
DROP INDEX IF EXISTS idx_community_rooms_geo;
CREATE UNIQUE INDEX idx_community_rooms_geo
    ON public.community_rooms(city, COALESCE(district, ''), COALESCE(building, ''));

-- =====================================================
-- 6. Обновить функцию ensure_community_rooms
-- =====================================================
-- Необходимо удалить старую функцию, т.к. изменился параметр p_street → p_district
DROP FUNCTION IF EXISTS public.ensure_community_rooms(text, text, text);

CREATE OR REPLACE FUNCTION public.ensure_community_rooms(
    p_city text,
    p_district text DEFAULT NULL,  -- Переименовано с p_street
    p_building text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_city_room_id bigint;
    v_district_room_id bigint;
BEGIN
    -- Создаём/получаем комнату города
    INSERT INTO public.community_rooms (level, city, name)
    VALUES ('city', p_city, p_city)
    ON CONFLICT (city, COALESCE(district, ''), COALESCE(building, ''))
    DO NOTHING
    RETURNING id INTO v_city_room_id;

    IF v_city_room_id IS NULL THEN
        SELECT id INTO v_city_room_id FROM public.community_rooms
        WHERE city = p_city AND district IS NULL AND building IS NULL;
    END IF;

    -- Создаём/получаем комнату района
    IF p_district IS NOT NULL AND p_district != '' THEN
        INSERT INTO public.community_rooms (level, parent_id, city, district, name)
        VALUES ('district', v_city_room_id, p_city, p_district, p_district)
        ON CONFLICT (city, COALESCE(district, ''), COALESCE(building, ''))
        DO NOTHING
        RETURNING id INTO v_district_room_id;

        IF v_district_room_id IS NULL THEN
            SELECT id INTO v_district_room_id FROM public.community_rooms
            WHERE city = p_city AND district = p_district AND building IS NULL;
        END IF;

        -- Создаём/получаем комнату дома
        IF p_building IS NOT NULL AND p_building != '' THEN
            INSERT INTO public.community_rooms (level, parent_id, city, district, building, name)
            VALUES ('building', v_district_room_id, p_city, p_district, p_building, 'д. ' || p_building)
            ON CONFLICT (city, COALESCE(district, ''), COALESCE(building, ''))
            DO NOTHING;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.ensure_community_rooms IS 'Автоматически создаёт комнаты для города/района/дома';

-- =====================================================
-- 7. Исправить баг с 99 непрочитанными в пустых чатах
-- =====================================================
-- Проблема: если пользователь не член комнаты (нет записи в community_members),
-- функция считала все сообщения непрочитанными.
-- Решение: для не-членов возвращать 0.

CREATE OR REPLACE FUNCTION public.get_community_unread_count(
    p_user_id bigint,
    p_room_ids bigint[]
) RETURNS TABLE(room_id bigint, unread_count integer) AS $$
BEGIN
    RETURN QUERY
    WITH user_reads AS (
        SELECT m.room_id, m.last_read_at
        FROM public.community_members m
        WHERE m.user_id = p_user_id
          AND m.room_id = ANY(p_room_ids)
    ),
    message_counts AS (
        SELECT
            msg.room_id,
            COUNT(*) FILTER (
                WHERE msg.created_at > ur.last_read_at  -- Только после last_read_at
            )::integer as cnt
        FROM public.community_messages msg
        INNER JOIN user_reads ur ON ur.room_id = msg.room_id  -- INNER JOIN: только для членов!
        WHERE msg.room_id = ANY(p_room_ids)
          AND msg.is_deleted = false
        GROUP BY msg.room_id
    )
    SELECT
        r.id as room_id,
        CASE
            -- Если пользователь не член комнаты → 0
            WHEN NOT EXISTS (
                SELECT 1 FROM user_reads ur WHERE ur.room_id = r.id
            ) THEN 0
            -- Если член, но last_read_at IS NULL → все сообщения непрочитанные (макс 99)
            WHEN EXISTS (
                SELECT 1 FROM user_reads ur
                WHERE ur.room_id = r.id AND ur.last_read_at IS NULL
            ) THEN (
                SELECT LEAST(COUNT(*)::integer, 99)
                FROM public.community_messages m
                WHERE m.room_id = r.id AND m.is_deleted = false
            )
            -- Иначе берём из message_counts
            ELSE COALESCE(mc.cnt, 0)
        END as unread_count
    FROM unnest(p_room_ids) r(id)
    LEFT JOIN message_counts mc ON mc.room_id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_community_unread_count IS 'Batch: подсчитывает непрочитанные для нескольких комнат. Для не-членов возвращает 0.';

-- =====================================================
-- 8. Обновить одиночную функцию тоже
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_community_unread_count_single(
    p_room_id bigint,
    p_user_id bigint
) RETURNS integer AS $$
DECLARE
    v_last_read timestamptz;
    v_is_member boolean;
    v_count integer;
BEGIN
    -- Проверяем, является ли пользователь членом комнаты
    SELECT last_read_at INTO v_last_read
    FROM public.community_members
    WHERE room_id = p_room_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        -- Не член комнаты → 0 непрочитанных
        RETURN 0;
    END IF;

    IF v_last_read IS NULL THEN
        -- Никогда не читал — считаем все сообщения (макс 99)
        SELECT LEAST(COUNT(*)::integer, 99) INTO v_count
        FROM public.community_messages
        WHERE room_id = p_room_id AND is_deleted = false;
    ELSE
        -- Считаем сообщения после last_read_at
        SELECT COUNT(*)::integer INTO v_count
        FROM public.community_messages
        WHERE room_id = p_room_id
          AND is_deleted = false
          AND created_at > v_last_read;
    END IF;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_community_unread_count_single IS 'Подсчитывает непрочитанные сообщения для одной комнаты. Для не-членов возвращает 0.';

-- =====================================================
-- 9. Обновить комментарии
-- =====================================================
COMMENT ON COLUMN public.community_rooms.level IS 'Уровень: city, district, building';
COMMENT ON COLUMN public.community_rooms.district IS 'Район (NULL для level=city)';

