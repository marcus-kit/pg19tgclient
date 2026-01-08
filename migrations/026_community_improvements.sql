-- Migration: 026_community_improvements.sql
-- Community Chat v2: nickname, mutes, reports, indexes

-- =====================================================
-- 1. Nickname (глобально уникальный)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'nickname'
    ) THEN
        ALTER TABLE public.users ADD COLUMN nickname text;
    END IF;
END
$$;

-- Ограничение длины (2-30 символов)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_nickname_length'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_nickname_length
            CHECK (nickname IS NULL OR (char_length(nickname) >= 2 AND char_length(nickname) <= 30));
    END IF;
END
$$;

-- Уникальный индекс (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_unique
    ON public.users(LOWER(nickname)) WHERE nickname IS NOT NULL;

COMMENT ON COLUMN public.users.nickname IS 'Уникальный никнейм для отображения в чате (2-30 символов)';

-- =====================================================
-- 2. Таблица мутов (временный запрет писать)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_mutes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    room_id bigint NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    muted_by bigint NOT NULL REFERENCES public.users(id),
    reason text,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE(room_id, user_id)
);

-- Индексы для мутов
CREATE INDEX IF NOT EXISTS idx_community_mutes_room ON public.community_mutes(room_id);
CREATE INDEX IF NOT EXISTS idx_community_mutes_user ON public.community_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_mutes_expires ON public.community_mutes(room_id, user_id, expires_at);

-- RLS для мутов
ALTER TABLE public.community_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to mutes" ON public.community_mutes;
CREATE POLICY "Service role full access to mutes"
    ON public.community_mutes FOR ALL
    TO service_role
    USING (true);

COMMENT ON TABLE public.community_mutes IS 'Временные муты пользователей в комнатах';
COMMENT ON COLUMN public.community_mutes.expires_at IS 'Срок окончания мута (обязателен)';

-- =====================================================
-- 3. Таблица жалоб на сообщения
-- =====================================================

-- Тип статуса жалобы
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_report_status') THEN
        CREATE TYPE public.community_report_status AS ENUM ('pending', 'reviewed', 'dismissed');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.community_reports (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    message_id bigint NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
    reported_by bigint NOT NULL REFERENCES public.users(id),
    reason text NOT NULL,
    details text,
    status public.community_report_status DEFAULT 'pending',
    reviewed_by bigint REFERENCES public.users(id),
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Один пользователь — одна жалоба на сообщение
    UNIQUE(message_id, reported_by)
);

-- Индексы для жалоб
CREATE INDEX IF NOT EXISTS idx_community_reports_message ON public.community_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON public.community_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_community_reports_pending ON public.community_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_community_reports_created ON public.community_reports(created_at DESC);

-- RLS для жалоб
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to reports" ON public.community_reports;
CREATE POLICY "Service role full access to reports"
    ON public.community_reports FOR ALL
    TO service_role
    USING (true);

COMMENT ON TABLE public.community_reports IS 'Жалобы на сообщения в чате';
COMMENT ON COLUMN public.community_reports.reason IS 'Причина: spam, abuse, fraud, other';
COMMENT ON COLUMN public.community_reports.status IS 'Статус: pending, reviewed, dismissed';

-- =====================================================
-- 4. Индексы для масштабирования
-- =====================================================

-- Оптимизация пагинации сообщений
CREATE INDEX IF NOT EXISTS idx_community_messages_room_id_desc
    ON public.community_messages(room_id, id DESC) WHERE is_deleted = false;

-- Быстрый поиск роли участника
CREATE INDEX IF NOT EXISTS idx_community_members_role_lookup
    ON public.community_members(room_id, user_id, role);

-- Поиск модераторов в комнате
CREATE INDEX IF NOT EXISTS idx_community_members_moderators
    ON public.community_members(room_id, role) WHERE role IN ('moderator', 'admin');

-- =====================================================
-- 5. Функции
-- =====================================================

-- Проверка активного мута
CREATE OR REPLACE FUNCTION public.check_community_mute(
    p_room_id bigint,
    p_user_id bigint
) RETURNS TABLE(is_muted boolean, expires_at timestamptz, reason text) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Подсчёт непрочитанных сообщений (одна комната)
CREATE OR REPLACE FUNCTION public.get_community_unread_count_single(
    p_room_id bigint,
    p_user_id bigint
) RETURNS integer AS $$
DECLARE
    v_last_read timestamptz;
    v_count integer;
BEGIN
    -- Получаем время последнего прочтения
    SELECT last_read_at INTO v_last_read
    FROM public.community_members
    WHERE room_id = p_room_id AND user_id = p_user_id;

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

-- Batch-версия: подсчёт непрочитанных для нескольких комнат сразу
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
                WHERE ur.last_read_at IS NULL
                   OR msg.created_at > ur.last_read_at
            )::integer as cnt
        FROM public.community_messages msg
        LEFT JOIN user_reads ur ON ur.room_id = msg.room_id
        WHERE msg.room_id = ANY(p_room_ids)
          AND msg.is_deleted = false
        GROUP BY msg.room_id
    )
    SELECT
        r.id as room_id,
        COALESCE(LEAST(mc.cnt, 99), 0) as unread_count
    FROM unnest(p_room_ids) r(id)
    LEFT JOIN message_counts mc ON mc.room_id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновление времени прочтения
CREATE OR REPLACE FUNCTION public.update_community_last_read(
    p_room_id bigint,
    p_user_id bigint
) RETURNS void AS $$
BEGIN
    UPDATE public.community_members
    SET last_read_at = now()
    WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Назначение роли участнику (только для global admin)
CREATE OR REPLACE FUNCTION public.set_community_member_role(
    p_room_id bigint,
    p_target_user_id bigint,
    p_new_role text,
    p_actor_user_id bigint
) RETURNS boolean AS $$
DECLARE
    v_actor_global_role text;
BEGIN
    -- Получаем глобальную роль актора
    SELECT role INTO v_actor_global_role
    FROM public.users
    WHERE id = p_actor_user_id;

    -- Только global admin может назначать роли
    IF v_actor_global_role != 'admin' THEN
        RETURN false;
    END IF;

    -- Обновляем роль целевого пользователя
    UPDATE public.community_members
    SET role = p_new_role::public.community_member_role
    WHERE room_id = p_room_id AND user_id = p_target_user_id;

    -- Если участника нет — добавляем его
    IF NOT FOUND THEN
        -- Получаем account_id пользователя
        INSERT INTO public.community_members (room_id, user_id, account_id, role)
        SELECT p_room_id, p_target_user_id, a.id, p_new_role::public.community_member_role
        FROM public.accounts a
        JOIN public.users u ON u.id = a.user_id
        WHERE u.id = p_target_user_id
        LIMIT 1;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверка уникальности никнейма
CREATE OR REPLACE FUNCTION public.check_nickname_available(
    p_nickname text,
    p_user_id bigint DEFAULT NULL
) RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Очистка истёкших мутов (можно вызывать по расписанию)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_mutes()
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    DELETE FROM public.community_mutes
    WHERE expires_at < now();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Комментарии
-- =====================================================

COMMENT ON FUNCTION public.check_community_mute IS 'Проверяет, замучен ли пользователь в комнате';
COMMENT ON FUNCTION public.get_community_unread_count_single IS 'Подсчитывает непрочитанные сообщения для одной комнаты';
COMMENT ON FUNCTION public.get_community_unread_count IS 'Batch: подсчитывает непрочитанные для нескольких комнат';
COMMENT ON FUNCTION public.update_community_last_read IS 'Обновляет время последнего прочтения';
COMMENT ON FUNCTION public.set_community_member_role IS 'Назначает роль участнику (только global admin)';
COMMENT ON FUNCTION public.check_nickname_available IS 'Проверяет доступность никнейма';
COMMENT ON FUNCTION public.cleanup_expired_mutes IS 'Удаляет истёкшие муты (для cron)';
