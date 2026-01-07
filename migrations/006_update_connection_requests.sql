-- Migration 006: Update Connection Requests Table
-- Add missing columns for full address support

-- Добавляем недостающие колонки
ALTER TABLE public.connection_requests
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address_text text,
  ADD COLUMN IF NOT EXISTS address_components jsonb,
  ADD COLUMN IF NOT EXISTS in_coverage_zone boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS coverage_zone_id bigint REFERENCES partner_coverage_zones(id),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Обновляем существующие записи (переносим данные)
UPDATE public.connection_requests
SET
  full_name = contact_name,
  phone = CASE WHEN contact_method = 'phone' THEN contact_value ELSE NULL END,
  address_text = COALESCE(address_full, address_raw),
  address_components = address_normalized,
  metadata = jsonb_build_object(
    'ip_address', COALESCE(ip_address::text, ''),
    'user_agent', COALESCE(user_agent, '')
  )
WHERE full_name IS NULL;

-- Создаём функцию проверки зоны покрытия (если ещё не существует)
CREATE OR REPLACE FUNCTION public.check_point_in_coverage(
  lat numeric,
  lon numeric
)
RETURNS TABLE (
  in_coverage boolean,
  zone_id bigint,
  zone_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to find a coverage zone containing the point
  RETURN QUERY
  SELECT
    true AS in_coverage,
    pcz.id AS zone_id,
    pcz.name AS zone_name
  FROM partner_coverage_zones pcz
  WHERE pcz.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(pcz.geometry::text),
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    )
  LIMIT 1;

  -- If no zone found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::bigint, NULL::text;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.check_point_in_coverage(numeric, numeric) IS
  'Проверяет, находится ли точка (lat, lon) в одной из активных зон покрытия';

-- Даём права на выполнение функции
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO service_role;

-- Создаём индекс для phone (если ещё не существует)
CREATE INDEX IF NOT EXISTS idx_connection_requests_phone ON public.connection_requests(phone);

-- Создаём индекс для in_coverage_zone (если ещё не существует)
CREATE INDEX IF NOT EXISTS idx_connection_requests_coverage ON public.connection_requests(in_coverage_zone, status);

-- Добавляем комментарии к новым колонкам
COMMENT ON COLUMN public.connection_requests.full_name IS 'ФИО пользователя';
COMMENT ON COLUMN public.connection_requests.phone IS 'Телефон в формате +7XXXXXXXXXX';
COMMENT ON COLUMN public.connection_requests.address_text IS 'Полный адрес в текстовом виде';
COMMENT ON COLUMN public.connection_requests.address_components IS 'Компоненты адреса (город, улица, дом)';
COMMENT ON COLUMN public.connection_requests.in_coverage_zone IS 'Находится ли адрес в зоне покрытия';
COMMENT ON COLUMN public.connection_requests.coverage_zone_id IS 'ID зоны покрытия (если в зоне)';
COMMENT ON COLUMN public.connection_requests.metadata IS 'Дополнительные данные (браузер, IP, etc)';
