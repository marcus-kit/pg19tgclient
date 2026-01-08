-- 041_final_cleanup.sql
-- Финальная очистка после UUID миграции

-- ========================================
-- 1. Исправить check_point_in_coverage
-- ========================================

DROP FUNCTION IF EXISTS public.check_point_in_coverage(numeric, numeric);

CREATE OR REPLACE FUNCTION public.check_point_in_coverage(lat numeric, lon numeric)
RETURNS TABLE(in_coverage boolean, zone_id uuid, zone_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем только в partner_coverage_zones (coverage_zones удалена в 037)
  RETURN QUERY
  SELECT
    true AS in_coverage,
    pcz.id AS zone_id,
    pcz.name AS zone_name
  FROM partner_coverage_zones pcz
  WHERE pcz.active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(pcz.geometry::text),
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    )
  LIMIT 1;

  -- Если не найдено
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.check_point_in_coverage IS 'Проверяет, находится ли точка в зоне покрытия партнёра';

-- ========================================
-- 2. Исправить mark_chat_messages_read
-- ========================================

DROP FUNCTION IF EXISTS public.mark_chat_messages_read(bigint, text);

CREATE OR REPLACE FUNCTION public.mark_chat_messages_read(p_chat_id uuid, p_reader_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_messages
  SET is_read = true, read_at = now()
  WHERE chat_id = p_chat_id
    AND is_read = false
    AND sender_type != p_reader_type;

  IF p_reader_type = 'admin' THEN
    UPDATE public.chats SET unread_admin_count = 0 WHERE id = p_chat_id;
  ELSE
    UPDATE public.chats SET unread_user_count = 0 WHERE id = p_chat_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_chat_messages_read(uuid, text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.mark_chat_messages_read IS 'Отмечает сообщения прочитанными для admin или user';

-- ========================================
-- 3. Очистить _uuid колонки в chats
-- ========================================

ALTER TABLE public.chats DROP COLUMN IF EXISTS account_id_uuid;
ALTER TABLE public.chats DROP COLUMN IF EXISTS assigned_to_uuid;

-- ========================================
-- 4. Исправить RLS политики ticket_comments
-- ========================================

DROP POLICY IF EXISTS "Users can view own ticket comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can comment on own tickets" ON public.ticket_comments;

CREATE POLICY "Users can view own ticket comments"
ON public.ticket_comments
FOR SELECT
TO authenticated
USING (
  ticket_id IN (
    SELECT id FROM tickets
    WHERE user_telegram_id = ((current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint)
  )
);

CREATE POLICY "Users can comment on own tickets"
ON public.ticket_comments
FOR INSERT
TO authenticated
WITH CHECK (
  ticket_id IN (
    SELECT id FROM tickets
    WHERE user_telegram_id = ((current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint)
  )
);
