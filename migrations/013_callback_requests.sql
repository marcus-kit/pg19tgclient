-- Migration: 013_callback_requests.sql
-- Заявки на обратный звонок

CREATE TABLE IF NOT EXISTS public.callback_requests (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  name text NOT NULL,
  phone text NOT NULL,

  -- Статус обработки
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new',        -- Новая заявка
    'processing', -- В обработке
    'completed',  -- Обработана
    'cancelled'   -- Отменена
  )),

  -- Метаданные
  source text DEFAULT 'website',  -- Источник: website, mobile, telegram
  ip_address text,
  user_agent text,

  processed_at timestamptz,
  processed_by bigint REFERENCES public.users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_callback_requests_status
  ON public.callback_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_callback_requests_phone
  ON public.callback_requests(phone);

-- RLS
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

-- Анонимные пользователи могут создавать заявки
DROP POLICY IF EXISTS "Anyone can create callback request" ON public.callback_requests;
CREATE POLICY "Anyone can create callback request"
  ON public.callback_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role полный доступ
DROP POLICY IF EXISTS "Service role full access to callback_requests" ON public.callback_requests;
CREATE POLICY "Service role full access to callback_requests"
  ON public.callback_requests FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE public.callback_requests IS 'Заявки на обратный звонок';
COMMENT ON COLUMN public.callback_requests.status IS 'Статус: new, processing, completed, cancelled';
