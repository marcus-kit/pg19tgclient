-- Migration 035: Fix check_point_in_coverage function for UUID
-- Обновление функции проверки покрытия после миграции на UUID

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS public.check_point_in_coverage(numeric, numeric);

-- Создаём новую функцию с UUID
CREATE OR REPLACE FUNCTION public.check_point_in_coverage(lat numeric, lon numeric)
RETURNS TABLE(in_coverage boolean, zone_id uuid, zone_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем в partner_coverage_zones (активные зоны партнёров)
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

  -- Если не найдено в партнёрских зонах, проверяем coverage_zones
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      true AS in_coverage,
      cz.id AS zone_id,
      cz.name AS zone_name
    FROM coverage_zones cz
    WHERE cz.is_active = true
      AND ST_Contains(
        ST_GeomFromGeoJSON(cz.geometry::text),
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)
      )
    LIMIT 1;
  END IF;

  -- Если нигде не найдено
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text;
  END IF;
END;
$$;

-- Даём права на выполнение
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO service_role;

COMMENT ON FUNCTION public.check_point_in_coverage IS 'Проверяет, находится ли точка (lat, lon) в зоне покрытия';
