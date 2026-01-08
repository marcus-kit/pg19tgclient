-- Migration: 024_partner_financials.sql
-- Description: Финансовые таблицы партнёрской программы
-- Created: 2026-01-08

-- ============================================
-- TABLE: partner_referrals
-- Клиенты, привлечённые партнёром
-- ============================================

CREATE TABLE IF NOT EXISTS partner_referrals (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  referral_source TEXT,
  coverage_zone_id BIGINT REFERENCES partner_coverage_zones(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'cancelled')),
  referred_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE partner_referrals IS 'Клиенты, привлечённые партнёрами';
COMMENT ON COLUMN partner_referrals.referral_source IS 'Источник привлечения (website, call, office)';
COMMENT ON COLUMN partner_referrals.status IS 'pending=ожидает, active=активен, churned=ушёл, cancelled=отменён';
COMMENT ON COLUMN partner_referrals.churned_at IS 'Дата ухода клиента (для расчёта комиссий)';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_id ON partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_account_id ON partner_referrals(account_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_status ON partner_referrals(status);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_coverage_zone_id ON partner_referrals(coverage_zone_id);

-- Уникальность: один аккаунт - один партнёр
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_referrals_account_unique
  ON partner_referrals(account_id) WHERE status IN ('pending', 'active');

-- ============================================
-- TABLE: partner_commissions
-- Начисленные комиссии партнёрам
-- ============================================

CREATE TABLE IF NOT EXISTS partner_commissions (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_id BIGINT NOT NULL REFERENCES partner_referrals(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('connection', 'monthly', 'bonus')),
  amount_kopeks BIGINT NOT NULL,
  base_amount_kopeks BIGINT,
  rate_percent NUMERIC(5,2),
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payout_id BIGINT REFERENCES partner_payouts(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE partner_commissions IS 'Начисленные комиссии партнёрам';
COMMENT ON COLUMN partner_commissions.commission_type IS 'connection=за подключение, monthly=ежемесячная, bonus=бонус';
COMMENT ON COLUMN partner_commissions.amount_kopeks IS 'Сумма комиссии в копейках';
COMMENT ON COLUMN partner_commissions.base_amount_kopeks IS 'Базовая сумма для расчёта (платёж клиента)';
COMMENT ON COLUMN partner_commissions.rate_percent IS 'Процентная ставка комиссии';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_id ON partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_referral_id ON partner_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_payout_id ON partner_commissions(payout_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_created_at ON partner_commissions(created_at);

-- ============================================
-- TABLE: partner_payouts
-- Выплаты партнёрам
-- ============================================

CREATE TABLE IF NOT EXISTS partner_payouts (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount_kopeks BIGINT NOT NULL,
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE partner_payouts IS 'Выплаты партнёрам';
COMMENT ON COLUMN partner_payouts.amount_kopeks IS 'Сумма выплаты в копейках';
COMMENT ON COLUMN partner_payouts.payment_method IS 'Способ выплаты (bank_transfer, card, cash)';
COMMENT ON COLUMN partner_payouts.payment_details IS 'Детали платежа (реквизиты, номер транзакции)';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_created_at ON partner_payouts(created_at);

-- ============================================
-- Триггеры
-- ============================================

CREATE OR REPLACE FUNCTION update_partner_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_referrals_updated_at ON partner_referrals;
CREATE TRIGGER trigger_update_partner_referrals_updated_at
  BEFORE UPDATE ON partner_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_referrals_updated_at();

CREATE OR REPLACE FUNCTION update_partner_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_commissions_updated_at ON partner_commissions;
CREATE TRIGGER trigger_update_partner_commissions_updated_at
  BEFORE UPDATE ON partner_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_commissions_updated_at();

CREATE OR REPLACE FUNCTION update_partner_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_payouts_updated_at ON partner_payouts;
CREATE TRIGGER trigger_update_partner_payouts_updated_at
  BEFORE UPDATE ON partner_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_payouts_updated_at();

-- ============================================
-- RLS политики
-- ============================================

ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

-- Partner referrals: Service role полный доступ
CREATE POLICY "partner_referrals_service_role_all" ON partner_referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Partner commissions: Service role полный доступ
CREATE POLICY "partner_commissions_service_role_all" ON partner_commissions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Partner payouts: Service role полный доступ
CREATE POLICY "partner_payouts_service_role_all" ON partner_payouts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Партнёр может читать свои данные
CREATE POLICY "partner_referrals_partner_read" ON partner_referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_referrals.partner_id
      AND partners.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "partner_commissions_partner_read" ON partner_commissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_commissions.partner_id
      AND partners.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "partner_payouts_partner_read" ON partner_payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_payouts.partner_id
      AND partners.auth_user_id = auth.uid()
    )
  );
