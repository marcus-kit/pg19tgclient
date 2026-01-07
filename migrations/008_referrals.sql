-- Migration: 008_referrals.sql
-- Реферальная программа

-- Таблица реферальных кодов
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,

  -- Бонусы (в копейках)
  inviter_bonus bigint NOT NULL DEFAULT 30000,  -- 300 руб
  invitee_bonus bigint NOT NULL DEFAULT 30000,  -- 300 руб

  -- Статистика
  total_invited integer NOT NULL DEFAULT 0,
  total_bonus bigint NOT NULL DEFAULT 0,

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_user
  ON public.referral_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code
  ON public.referral_codes(code);

-- Таблица рефералов (приглашённых)
CREATE TABLE IF NOT EXISTS public.referrals (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  referral_code_id bigint NOT NULL REFERENCES public.referral_codes(id),
  inviter_user_id bigint NOT NULL REFERENCES public.users(id),
  invitee_user_id bigint NOT NULL REFERENCES public.users(id),

  -- Статус
  status text NOT NULL DEFAULT 'registered' CHECK (status IN (
    'registered',   -- Зарегистрирован
    'activated',    -- Активирован (подключен)
    'bonus_paid'    -- Бонус выплачен
  )),

  -- Бонусы
  inviter_bonus bigint,
  invitee_bonus bigint,
  bonus_paid_at timestamptz,

  registered_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter
  ON public.referrals(inviter_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_invitee
  ON public.referrals(invitee_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_invitee_unique
  ON public.referrals(invitee_user_id);

-- RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Политики для referral_codes
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to referral_codes" ON public.referral_codes;
CREATE POLICY "Service role full access to referral_codes"
  ON public.referral_codes FOR ALL
  TO service_role
  USING (true);

-- Политики для referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to referrals" ON public.referrals;
CREATE POLICY "Service role full access to referrals"
  ON public.referrals FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE public.referral_codes IS 'Реферальные коды пользователей';
COMMENT ON TABLE public.referrals IS 'Приглашённые пользователи';
COMMENT ON COLUMN public.referral_codes.inviter_bonus IS 'Бонус пригласившему (копейки)';
COMMENT ON COLUMN public.referral_codes.invitee_bonus IS 'Бонус приглашённому (копейки)';
