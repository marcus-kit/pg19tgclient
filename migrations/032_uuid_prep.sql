-- Migration: 032_uuid_prep.sql
-- Description: Подготовка UUID колонок для всех таблиц (Фаза 1 из 3)
-- Created: 2026-01-08
--
-- ВАЖНО: Эта миграция НЕ требует downtime!
-- Добавляет id_uuid и *_uuid колонки параллельно с существующими bigint.
--
-- Порядок выполнения:
--   032_uuid_prep.sql → добавление колонок (эта миграция)
--   033_uuid_data.sql → заполнение UUID данных
--   034_uuid_finalize.sql → переключение PK/FK (требует maintenance window)

-- =====================================================
-- Уровень 0: Таблицы без FK зависимостей
-- =====================================================

-- service_categories
ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

-- tv_channel_categories
ALTER TABLE public.tv_channel_categories
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

-- site_content
ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

-- community_rooms (self-ref FK будет обработан отдельно)
ALTER TABLE public.community_rooms
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_rooms
  ADD COLUMN IF NOT EXISTS parent_id_uuid UUID;

-- =====================================================
-- Уровень 1: Базовые таблицы
-- =====================================================

-- users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

-- services (FK: category_id → service_categories)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category_id_uuid UUID;

-- news
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

-- coverage_zones (FK: partner_id → partners, добавим позже)
ALTER TABLE public.coverage_zones
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.coverage_zones
  ADD COLUMN IF NOT EXISTS partner_id_uuid UUID;

-- =====================================================
-- Уровень 2: Таблицы с FK на уровень 1
-- =====================================================

-- accounts (FK: user_id → users)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- partners (FK: user_id → users)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- achievements (FK: user_id → users)
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- referral_codes (FK: user_id → users)
ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- news_attachments (FK: news_id → news)
ALTER TABLE public.news_attachments
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.news_attachments
  ADD COLUMN IF NOT EXISTS news_id_uuid UUID;

-- chats (FK: user_id, account_id, assigned_to → users/accounts)
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS assigned_to_uuid UUID;

-- notification_settings (FK: user_id → users)
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- callback_requests (FK: processed_by → users)
ALTER TABLE public.callback_requests
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.callback_requests
  ADD COLUMN IF NOT EXISTS processed_by_uuid UUID;

-- =====================================================
-- Уровень 3: Таблицы с FK на уровень 2
-- =====================================================

-- subscriptions (FK: account_id → accounts, service_id → services)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS service_id_uuid UUID;

-- payments (FK: account_id → accounts)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

-- invoices (FK: account_id → accounts)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

-- auth_sessions (FK: user_id → users, account_id → accounts)
ALTER TABLE public.auth_sessions
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.auth_sessions
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.auth_sessions
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

-- referrals (FK: referral_code_id, inviter_user_id, invitee_user_id)
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referral_code_id_uuid UUID;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS inviter_user_id_uuid UUID;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS invitee_user_id_uuid UUID;

-- partner_coverage_zones (FK: partner_id → partners)
ALTER TABLE public.partner_coverage_zones
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.partner_coverage_zones
  ADD COLUMN IF NOT EXISTS partner_id_uuid UUID;

-- community_members (FK: room_id, user_id, account_id)
ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS room_id_uuid UUID;

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

-- chat_messages (FK: chat_id, sender_id)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS chat_id_uuid UUID;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS sender_id_uuid UUID;

-- tickets (FK: user_id, related_service_id, related_subscription_id)
-- Примечание: assigned_admin_id уже UUID (ссылается на admins)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS related_service_id_uuid UUID;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS related_subscription_id_uuid UUID;

-- partner_payouts (FK: partner_id, processed_by_user_id)
ALTER TABLE public.partner_payouts
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.partner_payouts
  ADD COLUMN IF NOT EXISTS partner_id_uuid UUID;

ALTER TABLE public.partner_payouts
  ADD COLUMN IF NOT EXISTS processed_by_user_id_uuid UUID;

-- connection_requests (FK: coverage_zone_id → partner_coverage_zones)
ALTER TABLE public.connection_requests
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.connection_requests
  ADD COLUMN IF NOT EXISTS coverage_zone_id_uuid UUID;

-- =====================================================
-- Уровень 4: Таблицы с FK на уровень 3
-- =====================================================

-- transactions (FK: account_id, subscription_id, payment_id, invoice_id)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS subscription_id_uuid UUID;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_id_uuid UUID;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS invoice_id_uuid UUID;

-- community_messages (FK: room_id, user_id, deleted_by, reply_to_id)
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS room_id_uuid UUID;

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS deleted_by_uuid UUID;

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS reply_to_id_uuid UUID;

-- ticket_comments (FK: ticket_id)
ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS ticket_id_uuid UUID;

-- ticket_history (FK: ticket_id)
-- Примечание: admin_id уже UUID (ссылается на admins)
ALTER TABLE public.ticket_history
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.ticket_history
  ADD COLUMN IF NOT EXISTS ticket_id_uuid UUID;

-- community_mutes (FK: room_id, user_id, muted_by)
ALTER TABLE public.community_mutes
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_mutes
  ADD COLUMN IF NOT EXISTS room_id_uuid UUID;

ALTER TABLE public.community_mutes
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.community_mutes
  ADD COLUMN IF NOT EXISTS muted_by_uuid UUID;

-- community_bans (FK: room_id, user_id, banned_by)
ALTER TABLE public.community_bans
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_bans
  ADD COLUMN IF NOT EXISTS room_id_uuid UUID;

ALTER TABLE public.community_bans
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

ALTER TABLE public.community_bans
  ADD COLUMN IF NOT EXISTS banned_by_uuid UUID;

-- partner_referrals (FK: partner_id, account_id, coverage_zone_id)
ALTER TABLE public.partner_referrals
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.partner_referrals
  ADD COLUMN IF NOT EXISTS partner_id_uuid UUID;

ALTER TABLE public.partner_referrals
  ADD COLUMN IF NOT EXISTS account_id_uuid UUID;

ALTER TABLE public.partner_referrals
  ADD COLUMN IF NOT EXISTS coverage_zone_id_uuid UUID;

-- =====================================================
-- Уровень 5: Таблицы с FK на уровень 4
-- =====================================================

-- community_reports (FK: message_id, reported_by, reviewed_by)
ALTER TABLE public.community_reports
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.community_reports
  ADD COLUMN IF NOT EXISTS message_id_uuid UUID;

ALTER TABLE public.community_reports
  ADD COLUMN IF NOT EXISTS reported_by_uuid UUID;

ALTER TABLE public.community_reports
  ADD COLUMN IF NOT EXISTS reviewed_by_uuid UUID;

-- partner_commissions (FK: partner_id, referral_id, payout_id)
ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();

ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS partner_id_uuid UUID;

ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS referral_id_uuid UUID;

ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS payout_id_uuid UUID;

-- =====================================================
-- Индексы для новых UUID колонок
-- (для быстрого поиска и JOIN в переходный период)
-- =====================================================

-- Основные таблицы
CREATE INDEX IF NOT EXISTS idx_users_id_uuid ON public.users(id_uuid);
CREATE INDEX IF NOT EXISTS idx_accounts_id_uuid ON public.accounts(id_uuid);
CREATE INDEX IF NOT EXISTS idx_services_id_uuid ON public.services(id_uuid);
CREATE INDEX IF NOT EXISTS idx_news_id_uuid ON public.news(id_uuid);
CREATE INDEX IF NOT EXISTS idx_partners_id_uuid ON public.partners(id_uuid);
CREATE INDEX IF NOT EXISTS idx_chats_id_uuid ON public.chats(id_uuid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_id_uuid ON public.subscriptions(id_uuid);
CREATE INDEX IF NOT EXISTS idx_payments_id_uuid ON public.payments(id_uuid);
CREATE INDEX IF NOT EXISTS idx_invoices_id_uuid ON public.invoices(id_uuid);
CREATE INDEX IF NOT EXISTS idx_transactions_id_uuid ON public.transactions(id_uuid);
CREATE INDEX IF NOT EXISTS idx_tickets_id_uuid ON public.tickets(id_uuid);
CREATE INDEX IF NOT EXISTS idx_community_rooms_id_uuid ON public.community_rooms(id_uuid);
CREATE INDEX IF NOT EXISTS idx_community_messages_id_uuid ON public.community_messages(id_uuid);

-- =====================================================
-- Комментарии
-- =====================================================

COMMENT ON COLUMN public.users.id_uuid IS 'UUID для миграции (станет PK в 034)';
COMMENT ON COLUMN public.accounts.id_uuid IS 'UUID для миграции (станет PK в 034)';
COMMENT ON COLUMN public.accounts.user_id_uuid IS 'UUID FK на users (станет FK в 034)';

-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- Уровень 5
ALTER TABLE public.partner_commissions DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS partner_id_uuid, DROP COLUMN IF EXISTS referral_id_uuid, DROP COLUMN IF EXISTS payout_id_uuid;
ALTER TABLE public.community_reports DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS message_id_uuid, DROP COLUMN IF EXISTS reported_by_uuid, DROP COLUMN IF EXISTS reviewed_by_uuid;

-- Уровень 4
ALTER TABLE public.partner_referrals DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS partner_id_uuid, DROP COLUMN IF EXISTS account_id_uuid, DROP COLUMN IF EXISTS coverage_zone_id_uuid;
ALTER TABLE public.community_bans DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS room_id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS banned_by_uuid;
ALTER TABLE public.community_mutes DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS room_id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS muted_by_uuid;
ALTER TABLE public.ticket_history DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS ticket_id_uuid;
ALTER TABLE public.ticket_comments DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS ticket_id_uuid;
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS room_id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS deleted_by_uuid, DROP COLUMN IF EXISTS reply_to_id_uuid;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS account_id_uuid, DROP COLUMN IF EXISTS subscription_id_uuid, DROP COLUMN IF EXISTS payment_id_uuid, DROP COLUMN IF EXISTS invoice_id_uuid;

-- Уровень 3
ALTER TABLE public.connection_requests DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS coverage_zone_id_uuid;
ALTER TABLE public.partner_payouts DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS partner_id_uuid, DROP COLUMN IF EXISTS processed_by_user_id_uuid;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS related_service_id_uuid, DROP COLUMN IF EXISTS related_subscription_id_uuid;
ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS chat_id_uuid, DROP COLUMN IF EXISTS sender_id_uuid;
ALTER TABLE public.community_members DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS room_id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS account_id_uuid;
ALTER TABLE public.partner_coverage_zones DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS partner_id_uuid;
ALTER TABLE public.referrals DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS referral_code_id_uuid, DROP COLUMN IF EXISTS inviter_user_id_uuid, DROP COLUMN IF EXISTS invitee_user_id_uuid;
ALTER TABLE public.auth_sessions DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS account_id_uuid;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS account_id_uuid;
ALTER TABLE public.payments DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS account_id_uuid;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS account_id_uuid, DROP COLUMN IF EXISTS service_id_uuid;

-- Уровень 2
ALTER TABLE public.callback_requests DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS processed_by_uuid;
ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid;
ALTER TABLE public.chats DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid, DROP COLUMN IF EXISTS account_id_uuid, DROP COLUMN IF EXISTS assigned_to_uuid;
ALTER TABLE public.news_attachments DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS news_id_uuid;
ALTER TABLE public.referral_codes DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid;
ALTER TABLE public.achievements DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid;
ALTER TABLE public.partners DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid;
ALTER TABLE public.accounts DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS user_id_uuid;

-- Уровень 1
ALTER TABLE public.coverage_zones DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS partner_id_uuid;
ALTER TABLE public.news DROP COLUMN IF EXISTS id_uuid;
ALTER TABLE public.services DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS category_id_uuid;
ALTER TABLE public.users DROP COLUMN IF EXISTS id_uuid;

-- Уровень 0
ALTER TABLE public.community_rooms DROP COLUMN IF EXISTS id_uuid, DROP COLUMN IF EXISTS parent_id_uuid;
ALTER TABLE public.site_content DROP COLUMN IF EXISTS id_uuid;
ALTER TABLE public.tv_channel_categories DROP COLUMN IF EXISTS id_uuid;
ALTER TABLE public.service_categories DROP COLUMN IF EXISTS id_uuid;

-- Индексы удалятся автоматически при удалении колонок
*/

