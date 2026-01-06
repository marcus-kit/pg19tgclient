-- PG19 Database Schema Migration
-- Exported from cloud Supabase and applied to local instance

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'terminated');
CREATE TYPE public.account_status AS ENUM ('active', 'blocked', 'closed');
CREATE TYPE public.contract_status AS ENUM ('draft', 'active', 'terminated', 'stopped');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE public.transaction_type AS ENUM ('charge', 'payment', 'correction', 'refund', 'bonus');
CREATE TYPE public.payment_provider AS ENUM ('yookassa', 'cloudpayments', 'sbp', 'cash', 'bank_transfer', 'terminal');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.auth_method AS ENUM ('contract', 'phone', 'email', 'telegram');
CREATE TYPE public.news_category AS ENUM ('announcement', 'protocol', 'notification');
CREATE TYPE public.news_status AS ENUM ('draft', 'published', 'archived');

-- =====================================================
-- SEQUENCES
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.accounts_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.services_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.subscriptions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.payments_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.invoices_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.auth_sessions_id_seq;

-- =====================================================
-- TABLES
-- =====================================================

-- Users table
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  status user_status NOT NULL DEFAULT 'active'::user_status,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  telegram_id text,
  telegram_username text,
  passport_series text,
  passport_number text,
  reg_city text,
  reg_street text,
  reg_building text,
  reg_apartment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date_updated timestamp with time zone NOT NULL DEFAULT now(),
  middle_name text,
  full_name text
);

-- Accounts table
CREATE TABLE public.accounts (
  id bigint NOT NULL DEFAULT nextval('accounts_id_seq'::regclass),
  status account_status NOT NULL DEFAULT 'active'::account_status,
  balance bigint NOT NULL DEFAULT 0,
  credit_limit bigint NOT NULL DEFAULT 0,
  address_city text,
  address_street text,
  address_building text,
  address_apartment text,
  address_entrance text,
  address_floor text,
  address_intercom text,
  address_full text,
  blocked_at timestamp with time zone,
  date_created timestamp with time zone NOT NULL DEFAULT now(),
  date_updated timestamp with time zone NOT NULL DEFAULT now(),
  contract_number bigint,
  user_id bigint,
  contract_status contract_status DEFAULT 'draft'::contract_status,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  notes text
);

COMMENT ON COLUMN public.accounts.balance IS 'Баланс в копейках';

-- Services table
CREATE TABLE public.services (
  id bigint NOT NULL DEFAULT nextval('services_id_seq'::regclass),
  name text NOT NULL,
  price_monthly bigint NOT NULL,
  price_connection bigint,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

COMMENT ON COLUMN public.services.price_monthly IS 'Ежемесячная стоимость в копейках';
COMMENT ON COLUMN public.services.price_connection IS 'Стоимость подключения в копейках';

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id bigint NOT NULL DEFAULT nextval('subscriptions_id_seq'::regclass),
  account_id bigint NOT NULL,
  service_id bigint NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active'::subscription_status,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  custom_price bigint,
  date_created timestamp with time zone NOT NULL DEFAULT now(),
  date_updated timestamp with time zone NOT NULL DEFAULT now(),
  is_primary boolean DEFAULT false
);

COMMENT ON COLUMN public.subscriptions.custom_price IS 'Индивидуальная цена в копейках (если отличается от стандартной)';
COMMENT ON COLUMN public.subscriptions.is_primary IS 'Основная подписка аккаунта (определяет тариф)';

-- Payments table
CREATE TABLE public.payments (
  id bigint NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  account_id bigint NOT NULL,
  amount bigint NOT NULL,
  provider payment_provider NOT NULL,
  external_id text,
  status payment_status NOT NULL DEFAULT 'pending'::payment_status,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  fiscal_receipt_id text,
  fiscalized_at timestamp with time zone,
  date_created timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone
);

-- Invoices table
CREATE TABLE public.invoices (
  id bigint NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
  invoice_number text NOT NULL,
  account_id bigint NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft'::invoice_status,
  amount bigint NOT NULL,
  description text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  issued_at timestamp with time zone,
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  date_created timestamp with time zone NOT NULL DEFAULT now(),
  date_updated timestamp with time zone NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id bigint NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
  account_id bigint NOT NULL,
  type transaction_type NOT NULL,
  amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  description text,
  subscription_id bigint,
  payment_id bigint,
  invoice_id bigint,
  fiscal_receipt_id text,
  fiscalized_at timestamp with time zone,
  date_created timestamp with time zone NOT NULL DEFAULT now()
);

-- Auth sessions table
CREATE TABLE public.auth_sessions (
  id bigint NOT NULL DEFAULT nextval('auth_sessions_id_seq'::regclass),
  method auth_method NOT NULL,
  identifier text NOT NULL,
  verification_code text,
  verified boolean NOT NULL DEFAULT false,
  user_id bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  verified_at timestamp with time zone,
  account_id bigint
);

-- News table
CREATE TABLE public.news (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  summary text,
  content text NOT NULL,
  category news_category NOT NULL DEFAULT 'announcement'::news_category,
  status news_status NOT NULL DEFAULT 'draft'::news_status,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_pinned boolean DEFAULT false,
  date_created timestamp with time zone DEFAULT now(),
  date_updated timestamp with time zone DEFAULT now()
);

-- News attachments table
CREATE TABLE public.news_attachments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  news_id bigint NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  sort_order integer DEFAULT 0,
  date_created timestamp with time zone DEFAULT now()
);

-- News read status table
CREATE TABLE public.news_read_status (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  news_id bigint NOT NULL,
  user_id bigint NOT NULL,
  read_at timestamp with time zone DEFAULT now()
);

-- Notification settings table
CREATE TABLE public.notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL,
  channel_email boolean DEFAULT true,
  channel_sms boolean DEFAULT false,
  channel_telegram boolean DEFAULT false,
  channel_push boolean DEFAULT false,
  notify_balance_low boolean DEFAULT true,
  notify_payment_received boolean DEFAULT true,
  notify_charges boolean DEFAULT true,
  notify_invoices boolean DEFAULT true,
  notify_tickets boolean DEFAULT true,
  notify_maintenance boolean DEFAULT true,
  notify_promos boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.notification_settings IS 'Stores user notification preferences for various channels and notification types';

-- =====================================================
-- PRIMARY KEYS & UNIQUE CONSTRAINTS
-- =====================================================

ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.users ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);

ALTER TABLE public.accounts ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.accounts ADD CONSTRAINT accounts_contract_number_key UNIQUE (contract_number);

ALTER TABLE public.services ADD CONSTRAINT services_pkey PRIMARY KEY (id);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE public.auth_sessions ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);

ALTER TABLE public.news_read_status ADD CONSTRAINT news_read_status_news_id_user_id_key UNIQUE (news_id, user_id);

ALTER TABLE public.notification_settings ADD CONSTRAINT notification_settings_user_id_key UNIQUE (user_id);

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

ALTER TABLE public.accounts ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);

ALTER TABLE public.payments ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.invoices ADD CONSTRAINT invoices_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);
ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_payment_id FOREIGN KEY (payment_id) REFERENCES public.payments(id);
ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);

ALTER TABLE public.auth_sessions ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.auth_sessions ADD CONSTRAINT auth_sessions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.news_attachments ADD CONSTRAINT news_attachments_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id);

ALTER TABLE public.news_read_status ADD CONSTRAINT news_read_status_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id);
ALTER TABLE public.news_read_status ADD CONSTRAINT news_read_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.notification_settings ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_contract_number ON public.accounts(contract_number);
CREATE INDEX idx_accounts_status ON public.accounts(status);

CREATE INDEX idx_subscriptions_account_id ON public.subscriptions(account_id);
CREATE INDEX idx_subscriptions_service_id ON public.subscriptions(service_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date_created ON public.transactions(date_created);

CREATE INDEX idx_payments_account_id ON public.payments(account_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE INDEX idx_invoices_account_id ON public.invoices(account_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

CREATE INDEX idx_auth_sessions_identifier ON public.auth_sessions(identifier);
CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);

CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to services
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);

-- Allow anonymous read access to published news
CREATE POLICY "Published news are viewable by everyone" ON public.news FOR SELECT USING (status = 'published');

-- Service role has full access
CREATE POLICY "Service role has full access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service role has full access to accounts" ON public.accounts FOR ALL USING (true);
CREATE POLICY "Service role has full access to subscriptions" ON public.subscriptions FOR ALL USING (true);
CREATE POLICY "Service role has full access to transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Service role has full access to payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Service role has full access to invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Service role has full access to auth_sessions" ON public.auth_sessions FOR ALL USING (true);
CREATE POLICY "Service role has full access to news" ON public.news FOR ALL USING (true);
CREATE POLICY "Service role has full access to news_attachments" ON public.news_attachments FOR ALL USING (true);
CREATE POLICY "Service role has full access to news_read_status" ON public.news_read_status FOR ALL USING (true);
CREATE POLICY "Service role has full access to notification_settings" ON public.notification_settings FOR ALL USING (true);

-- =====================================================
-- TRIGGERS FOR date_updated
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_date_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.date_updated = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_date_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_date_updated();

CREATE TRIGGER update_accounts_date_updated
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_date_updated();

CREATE TRIGGER update_subscriptions_date_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_date_updated();

CREATE TRIGGER update_invoices_date_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_date_updated();

CREATE TRIGGER update_news_date_updated
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_date_updated();
