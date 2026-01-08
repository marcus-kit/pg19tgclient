-- 038_cleanup_old_columns.sql
-- Удаление колонок _old после UUID миграции
-- Исправление RLS политик для использования новых UUID колонок

-- ========================================
-- 1. Исправить RLS политику partner_coverage_zones
-- ========================================

DROP POLICY IF EXISTS "Partners can manage own zones via auth" ON public.partner_coverage_zones;

CREATE POLICY "Partners can manage own zones via auth"
ON public.partner_coverage_zones
FOR ALL
USING (
  partner_id IN (
    SELECT id FROM partners WHERE auth_user_id = auth.uid()
  )
);

-- ========================================
-- 2. Удалить _old колонки из partner_coverage_zones
-- ========================================

ALTER TABLE public.partner_coverage_zones DROP COLUMN IF EXISTS id_old;
ALTER TABLE public.partner_coverage_zones DROP COLUMN IF EXISTS partner_id_old;

-- Сделать partner_id обязательным
ALTER TABLE public.partner_coverage_zones ALTER COLUMN partner_id SET NOT NULL;

-- ========================================
-- 3. Проверить и удалить _old колонки из partners
-- ========================================

-- Сначала проверим, есть ли политики зависящие от id_old в partners
DROP POLICY IF EXISTS "Partners can view own data" ON public.partners;

CREATE POLICY "Partners can view own data"
ON public.partners
FOR SELECT
USING (auth_user_id = auth.uid());

ALTER TABLE public.partners DROP COLUMN IF EXISTS id_old CASCADE;

-- ========================================
-- 4. Удалить _old колонки из других таблиц (если есть)
-- ========================================

-- partner_referrals
ALTER TABLE public.partner_referrals DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.partner_referrals DROP COLUMN IF EXISTS partner_id_old CASCADE;
ALTER TABLE public.partner_referrals DROP COLUMN IF EXISTS coverage_zone_id_old CASCADE;

-- partner_commissions
ALTER TABLE public.partner_commissions DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.partner_commissions DROP COLUMN IF EXISTS partner_id_old CASCADE;
ALTER TABLE public.partner_commissions DROP COLUMN IF EXISTS referral_id_old CASCADE;

-- connection_requests
ALTER TABLE public.connection_requests DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.connection_requests DROP COLUMN IF EXISTS coverage_zone_id_old CASCADE;
