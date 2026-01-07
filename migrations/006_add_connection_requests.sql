-- Migration 006: Connection Requests Table and Coverage Check Function
-- Created: 2026-01-07
-- Purpose: Enable online connection requests with address validation

-- =====================================================
-- 1. CONNECTION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Contact Information
  full_name text NOT NULL,
  phone text NOT NULL,

  -- Address Details
  address_text text NOT NULL,
  address_components jsonb,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,

  -- Coverage Validation
  in_coverage_zone boolean NOT NULL DEFAULT false,
  coverage_zone_id bigint REFERENCES partner_coverage_zones(id),

  -- Request Status
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'approved', 'rejected', 'completed')),

  -- Metadata
  source text DEFAULT 'website',
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.connection_requests IS 'Заявки на подключение от пользователей';
COMMENT ON COLUMN public.connection_requests.full_name IS 'ФИО пользователя';
COMMENT ON COLUMN public.connection_requests.phone IS 'Телефон в формате +7XXXXXXXXXX';
COMMENT ON COLUMN public.connection_requests.address_text IS 'Полный адрес в текстовом виде';
COMMENT ON COLUMN public.connection_requests.address_components IS 'Компоненты адреса (город, улица, дом)';
COMMENT ON COLUMN public.connection_requests.latitude IS 'Широта (WGS84)';
COMMENT ON COLUMN public.connection_requests.longitude IS 'Долгота (WGS84)';
COMMENT ON COLUMN public.connection_requests.in_coverage_zone IS 'Находится ли адрес в зоне покрытия';
COMMENT ON COLUMN public.connection_requests.coverage_zone_id IS 'ID зоны покрытия (если в зоне)';
COMMENT ON COLUMN public.connection_requests.status IS 'Статус обработки заявки';
COMMENT ON COLUMN public.connection_requests.source IS 'Источник заявки (website, mobile_app, call_center)';
COMMENT ON COLUMN public.connection_requests.metadata IS 'Дополнительные данные (браузер, IP, etc)';

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX idx_connection_requests_status
  ON public.connection_requests(status);

CREATE INDEX idx_connection_requests_created_at
  ON public.connection_requests(created_at DESC);

CREATE INDEX idx_connection_requests_phone
  ON public.connection_requests(phone);

CREATE INDEX idx_connection_requests_coverage
  ON public.connection_requests(in_coverage_zone, status);

-- =====================================================
-- 3. POSTGIS COVERAGE CHECK FUNCTION
-- =====================================================

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

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for all (anonymous users can create requests)
CREATE POLICY "Allow public to create connection requests"
  ON public.connection_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only service role can SELECT/UPDATE/DELETE
CREATE POLICY "Only service role can read connection requests"
  ON public.connection_requests
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Only service role can update connection requests"
  ON public.connection_requests
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can delete connection requests"
  ON public.connection_requests
  FOR DELETE
  TO service_role
  USING (true);

-- =====================================================
-- 5. UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_connection_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_connection_requests_updated_at();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant INSERT to anon role (for public form submissions)
GRANT INSERT ON public.connection_requests TO anon;
GRANT INSERT ON public.connection_requests TO authenticated;

-- Grant full access to service role
GRANT ALL ON public.connection_requests TO service_role;
GRANT USAGE ON SEQUENCE connection_requests_id_seq TO service_role;

-- Grant execute on function to all roles
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_point_in_coverage(numeric, numeric) TO service_role;
