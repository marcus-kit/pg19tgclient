-- Migration 036: Fix community functions for UUID
-- Обновление всех community функций для работы с UUID вместо bigint

-- ============================================
-- Drop old functions with bigint signatures
-- ============================================

DROP FUNCTION IF EXISTS public.check_community_mute(bigint, bigint);
DROP FUNCTION IF EXISTS public.get_community_unread_count_single(bigint, bigint);
DROP FUNCTION IF EXISTS public.get_community_unread_count(bigint, uuid[]);
DROP FUNCTION IF EXISTS public.get_community_unread_count(bigint, bigint[]);
DROP FUNCTION IF EXISTS public.update_community_last_read(bigint, bigint);
DROP FUNCTION IF EXISTS public.set_community_member_role(bigint, bigint, bigint, text);
DROP FUNCTION IF EXISTS public.check_nickname_available(text, bigint);
DROP FUNCTION IF EXISTS public.ensure_community_rooms(text, text, text);

-- ============================================
-- check_community_mute (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.check_community_mute(p_room_id uuid, p_user_id uuid)
RETURNS TABLE(is_muted boolean, expires_at timestamp with time zone, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        true as is_muted,
        m.expires_at,
        m.reason
    FROM public.community_mutes m
    WHERE m.room_id = p_room_id
      AND m.user_id = p_user_id
      AND m.expires_at > now()
    LIMIT 1;

    -- Если нет результата, вернуть false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::boolean, NULL::timestamptz, NULL::text;
    END IF;
END;
$function$;

-- ============================================
-- check_nickname_available (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.check_nickname_available(p_nickname text, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_exists boolean;
BEGIN
    IF p_nickname IS NULL OR p_nickname = '' THEN
        RETURN true;
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.users
        WHERE LOWER(nickname) = LOWER(p_nickname)
          AND (p_user_id IS NULL OR id != p_user_id)
    ) INTO v_exists;

    RETURN NOT v_exists;
END;
$function$;

-- ============================================
-- ensure_community_rooms (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.ensure_community_rooms(p_city text, p_district text DEFAULT NULL, p_building text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_city_room_id uuid;
    v_district_room_id uuid;
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
$function$;

-- ============================================
-- get_community_unread_count (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_community_unread_count(p_user_id uuid, p_room_ids uuid[])
RETURNS TABLE(room_id uuid, unread_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
                WHERE msg.created_at > ur.last_read_at
            )::integer as cnt
        FROM public.community_messages msg
        INNER JOIN user_reads ur ON ur.room_id = msg.room_id
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
$function$;

-- ============================================
-- get_community_unread_count_single (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_community_unread_count_single(p_room_id uuid, p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_last_read timestamptz;
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

    RETURN v_count;
END;
$function$;

-- ============================================
-- update_community_last_read (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_community_last_read(p_room_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.community_members
    SET last_read_at = now()
    WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$function$;

-- ============================================
-- set_community_member_role (UUID version)
-- ============================================

CREATE OR REPLACE FUNCTION public.set_community_member_role(
    p_room_id uuid,
    p_target_user_id uuid,
    p_actor_user_id uuid,
    p_new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_actor_role text;
BEGIN
    -- Получаем роль того, кто меняет
    SELECT role INTO v_actor_role
    FROM public.community_members
    WHERE room_id = p_room_id AND user_id = p_actor_user_id;

    -- Проверяем права
    IF v_actor_role IS NULL OR v_actor_role NOT IN ('admin', 'moderator') THEN
        RETURN false;
    END IF;

    -- Модератор не может менять роль админам
    IF v_actor_role = 'moderator' THEN
        IF EXISTS (
            SELECT 1 FROM public.community_members
            WHERE room_id = p_room_id
              AND user_id = p_target_user_id
              AND role = 'admin'
        ) THEN
            RETURN false;
        END IF;
    END IF;

    -- Обновляем роль
    UPDATE public.community_members
    SET role = p_new_role
    WHERE room_id = p_room_id AND user_id = p_target_user_id;

    RETURN FOUND;
END;
$function$;

-- ============================================
-- Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.check_community_mute(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_nickname_available(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_community_rooms(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_unread_count(uuid, uuid[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_unread_count_single(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_community_last_read(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_community_member_role(uuid, uuid, uuid, text) TO anon, authenticated, service_role;

-- Comments
COMMENT ON FUNCTION public.check_community_mute IS 'Проверяет, замьючен ли пользователь в комнате';
COMMENT ON FUNCTION public.check_nickname_available IS 'Проверяет доступность никнейма';
COMMENT ON FUNCTION public.ensure_community_rooms IS 'Создаёт иерархию комнат (город/район/дом)';
COMMENT ON FUNCTION public.get_community_unread_count IS 'Возвращает количество непрочитанных сообщений для списка комнат';
COMMENT ON FUNCTION public.get_community_unread_count_single IS 'Возвращает количество непрочитанных сообщений для одной комнаты';
COMMENT ON FUNCTION public.update_community_last_read IS 'Обновляет время последнего прочтения';
COMMENT ON FUNCTION public.set_community_member_role IS 'Устанавливает роль участника комнаты';
