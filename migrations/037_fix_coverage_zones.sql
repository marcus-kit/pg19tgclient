-- 037_fix_coverage_zones.sql
-- 1. Изменение FK: coverage_zone_id → partner_coverage_zones (connection_requests, partner_referrals)
-- 2. Удаление пустой таблицы coverage_zones

-- ========================================
-- 1. Изменить FK на connection_requests
-- ========================================

-- Удаляем старый FK (уже удалён в предыдущем запуске)
ALTER TABLE public.connection_requests
DROP CONSTRAINT IF EXISTS connection_requests_coverage_zone_id_fkey;

-- Создаём новый FK на partner_coverage_zones (уже добавлен)
ALTER TABLE public.connection_requests
ADD CONSTRAINT connection_requests_coverage_zone_id_fkey
FOREIGN KEY (coverage_zone_id)
REFERENCES public.partner_coverage_zones(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.connection_requests.coverage_zone_id IS 'FK на зону покрытия партнёра (partner_coverage_zones)';

-- ========================================
-- 2. Изменить FK на partner_referrals
-- ========================================

ALTER TABLE public.partner_referrals
DROP CONSTRAINT IF EXISTS partner_referrals_coverage_zone_id_fkey;

ALTER TABLE public.partner_referrals
ADD CONSTRAINT partner_referrals_coverage_zone_id_fkey
FOREIGN KEY (coverage_zone_id)
REFERENCES public.partner_coverage_zones(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.partner_referrals.coverage_zone_id IS 'FK на зону покрытия партнёра (partner_coverage_zones)';

-- ========================================
-- 3. Удалить таблицу coverage_zones
-- ========================================

DROP TABLE IF EXISTS public.coverage_zones CASCADE;

-- ========================================
-- 4. Обновить комментарий к функции
-- ========================================

COMMENT ON FUNCTION public.check_point_in_coverage(numeric, numeric) IS 'Проверяет, находится ли точка в зоне покрытия партнёра (partner_coverage_zones)';
