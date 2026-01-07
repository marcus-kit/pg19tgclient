-- Migration: 007_achievements.sql
-- Таблица достижений пользователей (геймификация)

CREATE TABLE IF NOT EXISTS public.achievements (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Связь с пользователем
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Тип достижения
  type text NOT NULL CHECK (type IN (
    'first_payment',      -- Первая оплата
    'year_with_us',       -- Год вместе
    'profile_complete',   -- Профиль заполнен
    'tariff_upgrade',     -- Улучшение тарифа
    'referral_first',     -- Первый друг
    'referral_five',      -- Пятеро друзей
    'referral_master',    -- Мастер рефералов (10+)
    'early_adopter',      -- Ранний участник
    'autopay'             -- Автоплатёж подключен
  )),

  -- Отображение
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'heroicons:trophy',

  -- Прогресс (для достижений с этапами)
  progress integer DEFAULT 0,
  max_progress integer DEFAULT 100,

  -- Статус
  unlocked_at timestamptz,  -- NULL = не разблокировано

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Уникальность: один тип достижения на пользователя
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_user_type
  ON public.achievements(user_id, type);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id
  ON public.achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_achievements_unlocked
  ON public.achievements(user_id, unlocked_at)
  WHERE unlocked_at IS NOT NULL;

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Политики доступа
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to achievements" ON public.achievements;
CREATE POLICY "Service role full access to achievements"
  ON public.achievements FOR ALL
  TO service_role
  USING (true);

-- Публичный доступ для anon (только чтение своих через API)
DROP POLICY IF EXISTS "Anon can view achievements via API" ON public.achievements;
CREATE POLICY "Anon can view achievements via API"
  ON public.achievements FOR SELECT
  TO anon
  USING (true);

COMMENT ON TABLE public.achievements IS 'Достижения пользователей (геймификация)';
COMMENT ON COLUMN public.achievements.type IS 'Тип достижения';
COMMENT ON COLUMN public.achievements.progress IS 'Текущий прогресс (0-max_progress)';
COMMENT ON COLUMN public.achievements.unlocked_at IS 'Дата разблокировки (NULL = заблокировано)';
