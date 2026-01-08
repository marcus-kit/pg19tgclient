-- Migration: 034_uuid_finalize.sql
-- Description: Финализация UUID миграции — переключение PK/FK (Фаза 3 из 3)
-- Created: 2026-01-08
--
-- ⚠️  ВАЖНО: ЭТА МИГРАЦИЯ ТРЕБУЕТ MAINTENANCE WINDOW! ⚠️
-- Ожидаемое время: 10-30 минут в зависимости от объёма данных.
--
-- Перед запуском:
--   1. Сделать бэкап: pg_dump -Fc dbname > backup_before_uuid.dump
--   2. Остановить приложения (frontend, API)
--   3. Убедиться что 032 и 033 выполнены успешно
--
-- Порядок выполнения:
--   032_uuid_prep.sql → добавление колонок
--   033_uuid_data.sql → заполнение UUID данных
--   034_uuid_finalize.sql → переключение PK/FK (эта миграция)

-- =====================================================
-- НАЧАЛО ТРАНЗАКЦИИ
-- =====================================================
BEGIN;

-- Отключаем триггеры на время миграции (ускорение)
SET session_replication_role = replica;

-- =====================================================
-- ЧАСТЬ 1: Удаление FK constraints
-- Порядок: от зависимых к независимым (обратный)
-- =====================================================

-- Уровень 5
ALTER TABLE public.partner_commissions DROP CONSTRAINT IF EXISTS partner_commissions_partner_id_fkey;
ALTER TABLE public.partner_commissions DROP CONSTRAINT IF EXISTS partner_commissions_referral_id_fkey;
ALTER TABLE public.partner_commissions DROP CONSTRAINT IF EXISTS partner_commissions_payout_id_fkey;

ALTER TABLE public.community_reports DROP CONSTRAINT IF EXISTS community_reports_message_id_fkey;
ALTER TABLE public.community_reports DROP CONSTRAINT IF EXISTS community_reports_reported_by_fkey;
ALTER TABLE public.community_reports DROP CONSTRAINT IF EXISTS community_reports_reviewed_by_fkey;

-- Уровень 4
ALTER TABLE public.partner_referrals DROP CONSTRAINT IF EXISTS partner_referrals_partner_id_fkey;
ALTER TABLE public.partner_referrals DROP CONSTRAINT IF EXISTS partner_referrals_account_id_fkey;
ALTER TABLE public.partner_referrals DROP CONSTRAINT IF EXISTS partner_referrals_coverage_zone_id_fkey;

ALTER TABLE public.community_bans DROP CONSTRAINT IF EXISTS community_bans_room_id_fkey;
ALTER TABLE public.community_bans DROP CONSTRAINT IF EXISTS community_bans_user_id_fkey;
ALTER TABLE public.community_bans DROP CONSTRAINT IF EXISTS community_bans_banned_by_fkey;

ALTER TABLE public.community_mutes DROP CONSTRAINT IF EXISTS community_mutes_room_id_fkey;
ALTER TABLE public.community_mutes DROP CONSTRAINT IF EXISTS community_mutes_user_id_fkey;
ALTER TABLE public.community_mutes DROP CONSTRAINT IF EXISTS community_mutes_muted_by_fkey;

ALTER TABLE public.ticket_history DROP CONSTRAINT IF EXISTS ticket_history_ticket_id_fkey;

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_fkey;

ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_room_id_fkey;
ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_user_id_fkey;
ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_deleted_by_fkey;
ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_reply_to_id_fkey;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_subscription_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_payment_id;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_invoice_id;

-- Уровень 3
ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS connection_requests_coverage_zone_id_fkey;

ALTER TABLE public.partner_payouts DROP CONSTRAINT IF EXISTS partner_payouts_partner_id_fkey;
ALTER TABLE public.partner_payouts DROP CONSTRAINT IF EXISTS partner_payouts_processed_by_user_id_fkey;

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_related_service_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_related_subscription_id_fkey;

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;

ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_room_id_fkey;
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_account_id_fkey;

ALTER TABLE public.partner_coverage_zones DROP CONSTRAINT IF EXISTS partner_coverage_zones_partner_id_fkey;

ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referral_code_id_fkey;
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_inviter_user_id_fkey;
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_invitee_user_id_fkey;

ALTER TABLE public.auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_user_id_fkey;
ALTER TABLE public.auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_account_id_fkey;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_account_id_fkey;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_account_id_fkey;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_account_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_service_id_fkey;

-- Уровень 2
ALTER TABLE public.callback_requests DROP CONSTRAINT IF EXISTS callback_requests_processed_by_fkey;

ALTER TABLE public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_account_id_fkey;
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_assigned_to_fkey;

ALTER TABLE public.news_attachments DROP CONSTRAINT IF EXISTS news_attachments_news_id_fkey;

ALTER TABLE public.referral_codes DROP CONSTRAINT IF EXISTS referral_codes_user_id_fkey;

ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_user_id_fkey;

ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_user_id_fkey;

ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;

-- Уровень 1
ALTER TABLE public.coverage_zones DROP CONSTRAINT IF EXISTS coverage_zones_partner_id_fkey;

ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_id_fkey;

-- Уровень 0 (self-ref)
ALTER TABLE public.community_rooms DROP CONSTRAINT IF EXISTS community_rooms_parent_id_fkey;

-- =====================================================
-- ЧАСТЬ 2: Удаление PK constraints
-- =====================================================

ALTER TABLE public.partner_commissions DROP CONSTRAINT IF EXISTS partner_commissions_pkey;
ALTER TABLE public.community_reports DROP CONSTRAINT IF EXISTS community_reports_pkey;
ALTER TABLE public.partner_referrals DROP CONSTRAINT IF EXISTS partner_referrals_pkey;
ALTER TABLE public.community_bans DROP CONSTRAINT IF EXISTS community_bans_pkey;
ALTER TABLE public.community_mutes DROP CONSTRAINT IF EXISTS community_mutes_pkey;
ALTER TABLE public.ticket_history DROP CONSTRAINT IF EXISTS ticket_history_pkey;
ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_pkey;
ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_pkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS connection_requests_pkey;
ALTER TABLE public.partner_payouts DROP CONSTRAINT IF EXISTS partner_payouts_pkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_pkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_pkey;
ALTER TABLE public.partner_coverage_zones DROP CONSTRAINT IF EXISTS partner_coverage_zones_pkey;
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_pkey;
ALTER TABLE public.auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_pkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE public.callback_requests DROP CONSTRAINT IF EXISTS callback_requests_pkey;
ALTER TABLE public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_pkey;
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_pkey;
ALTER TABLE public.news_attachments DROP CONSTRAINT IF EXISTS news_attachments_pkey;
ALTER TABLE public.referral_codes DROP CONSTRAINT IF EXISTS referral_codes_pkey;
ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_pkey;
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_pkey;
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE public.coverage_zones DROP CONSTRAINT IF EXISTS coverage_zones_pkey;
ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_pkey;
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.community_rooms DROP CONSTRAINT IF EXISTS community_rooms_pkey;
ALTER TABLE public.site_content DROP CONSTRAINT IF EXISTS site_content_pkey;
ALTER TABLE public.tv_channel_categories DROP CONSTRAINT IF EXISTS tv_channel_categories_pkey;
ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_pkey;

-- =====================================================
-- ЧАСТЬ 3: Переименование колонок
-- id → id_old, id_uuid → id
-- *_fk → *_fk_old, *_fk_uuid → *_fk
-- =====================================================

-- Уровень 0
ALTER TABLE public.service_categories RENAME COLUMN id TO id_old;
ALTER TABLE public.service_categories RENAME COLUMN id_uuid TO id;

ALTER TABLE public.tv_channel_categories RENAME COLUMN id TO id_old;
ALTER TABLE public.tv_channel_categories RENAME COLUMN id_uuid TO id;

ALTER TABLE public.site_content RENAME COLUMN id TO id_old;
ALTER TABLE public.site_content RENAME COLUMN id_uuid TO id;

ALTER TABLE public.community_rooms RENAME COLUMN id TO id_old;
ALTER TABLE public.community_rooms RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_rooms RENAME COLUMN parent_id TO parent_id_old;
ALTER TABLE public.community_rooms RENAME COLUMN parent_id_uuid TO parent_id;

-- Уровень 1
ALTER TABLE public.users RENAME COLUMN id TO id_old;
ALTER TABLE public.users RENAME COLUMN id_uuid TO id;

ALTER TABLE public.services RENAME COLUMN id TO id_old;
ALTER TABLE public.services RENAME COLUMN id_uuid TO id;
ALTER TABLE public.services RENAME COLUMN category_id TO category_id_old;
ALTER TABLE public.services RENAME COLUMN category_id_uuid TO category_id;

ALTER TABLE public.news RENAME COLUMN id TO id_old;
ALTER TABLE public.news RENAME COLUMN id_uuid TO id;

ALTER TABLE public.coverage_zones RENAME COLUMN id TO id_old;
ALTER TABLE public.coverage_zones RENAME COLUMN id_uuid TO id;
ALTER TABLE public.coverage_zones RENAME COLUMN partner_id TO partner_id_old;
ALTER TABLE public.coverage_zones RENAME COLUMN partner_id_uuid TO partner_id;

-- Уровень 2
ALTER TABLE public.accounts RENAME COLUMN id TO id_old;
ALTER TABLE public.accounts RENAME COLUMN id_uuid TO id;
ALTER TABLE public.accounts RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.accounts RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.partners RENAME COLUMN id TO id_old;
ALTER TABLE public.partners RENAME COLUMN id_uuid TO id;
ALTER TABLE public.partners RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.partners RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.achievements RENAME COLUMN id TO id_old;
ALTER TABLE public.achievements RENAME COLUMN id_uuid TO id;
ALTER TABLE public.achievements RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.achievements RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.referral_codes RENAME COLUMN id TO id_old;
ALTER TABLE public.referral_codes RENAME COLUMN id_uuid TO id;
ALTER TABLE public.referral_codes RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.referral_codes RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.news_attachments RENAME COLUMN id TO id_old;
ALTER TABLE public.news_attachments RENAME COLUMN id_uuid TO id;
ALTER TABLE public.news_attachments RENAME COLUMN news_id TO news_id_old;
ALTER TABLE public.news_attachments RENAME COLUMN news_id_uuid TO news_id;

ALTER TABLE public.chats RENAME COLUMN id TO id_old;
ALTER TABLE public.chats RENAME COLUMN id_uuid TO id;
ALTER TABLE public.chats RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.chats RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.chats RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.chats RENAME COLUMN account_id_uuid TO account_id;
ALTER TABLE public.chats RENAME COLUMN assigned_to TO assigned_to_old;
ALTER TABLE public.chats RENAME COLUMN assigned_to_uuid TO assigned_to;

ALTER TABLE public.notification_settings RENAME COLUMN id TO id_old;
ALTER TABLE public.notification_settings RENAME COLUMN id_uuid TO id;
ALTER TABLE public.notification_settings RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.notification_settings RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.callback_requests RENAME COLUMN id TO id_old;
ALTER TABLE public.callback_requests RENAME COLUMN id_uuid TO id;
ALTER TABLE public.callback_requests RENAME COLUMN processed_by TO processed_by_old;
ALTER TABLE public.callback_requests RENAME COLUMN processed_by_uuid TO processed_by;

-- Уровень 3
ALTER TABLE public.subscriptions RENAME COLUMN id TO id_old;
ALTER TABLE public.subscriptions RENAME COLUMN id_uuid TO id;
ALTER TABLE public.subscriptions RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.subscriptions RENAME COLUMN account_id_uuid TO account_id;
ALTER TABLE public.subscriptions RENAME COLUMN service_id TO service_id_old;
ALTER TABLE public.subscriptions RENAME COLUMN service_id_uuid TO service_id;

ALTER TABLE public.payments RENAME COLUMN id TO id_old;
ALTER TABLE public.payments RENAME COLUMN id_uuid TO id;
ALTER TABLE public.payments RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.payments RENAME COLUMN account_id_uuid TO account_id;

ALTER TABLE public.invoices RENAME COLUMN id TO id_old;
ALTER TABLE public.invoices RENAME COLUMN id_uuid TO id;
ALTER TABLE public.invoices RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.invoices RENAME COLUMN account_id_uuid TO account_id;

ALTER TABLE public.auth_sessions RENAME COLUMN id TO id_old;
ALTER TABLE public.auth_sessions RENAME COLUMN id_uuid TO id;
ALTER TABLE public.auth_sessions RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.auth_sessions RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.auth_sessions RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.auth_sessions RENAME COLUMN account_id_uuid TO account_id;

ALTER TABLE public.referrals RENAME COLUMN id TO id_old;
ALTER TABLE public.referrals RENAME COLUMN id_uuid TO id;
ALTER TABLE public.referrals RENAME COLUMN referral_code_id TO referral_code_id_old;
ALTER TABLE public.referrals RENAME COLUMN referral_code_id_uuid TO referral_code_id;
ALTER TABLE public.referrals RENAME COLUMN inviter_user_id TO inviter_user_id_old;
ALTER TABLE public.referrals RENAME COLUMN inviter_user_id_uuid TO inviter_user_id;
ALTER TABLE public.referrals RENAME COLUMN invitee_user_id TO invitee_user_id_old;
ALTER TABLE public.referrals RENAME COLUMN invitee_user_id_uuid TO invitee_user_id;

ALTER TABLE public.partner_coverage_zones RENAME COLUMN id TO id_old;
ALTER TABLE public.partner_coverage_zones RENAME COLUMN id_uuid TO id;
ALTER TABLE public.partner_coverage_zones RENAME COLUMN partner_id TO partner_id_old;
ALTER TABLE public.partner_coverage_zones RENAME COLUMN partner_id_uuid TO partner_id;

ALTER TABLE public.community_members RENAME COLUMN id TO id_old;
ALTER TABLE public.community_members RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_members RENAME COLUMN room_id TO room_id_old;
ALTER TABLE public.community_members RENAME COLUMN room_id_uuid TO room_id;
ALTER TABLE public.community_members RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.community_members RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.community_members RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.community_members RENAME COLUMN account_id_uuid TO account_id;

ALTER TABLE public.chat_messages RENAME COLUMN id TO id_old;
ALTER TABLE public.chat_messages RENAME COLUMN id_uuid TO id;
ALTER TABLE public.chat_messages RENAME COLUMN chat_id TO chat_id_old;
ALTER TABLE public.chat_messages RENAME COLUMN chat_id_uuid TO chat_id;
ALTER TABLE public.chat_messages RENAME COLUMN sender_id TO sender_id_old;
ALTER TABLE public.chat_messages RENAME COLUMN sender_id_uuid TO sender_id;

ALTER TABLE public.tickets RENAME COLUMN id TO id_old;
ALTER TABLE public.tickets RENAME COLUMN id_uuid TO id;
ALTER TABLE public.tickets RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.tickets RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.tickets RENAME COLUMN related_service_id TO related_service_id_old;
ALTER TABLE public.tickets RENAME COLUMN related_service_id_uuid TO related_service_id;
ALTER TABLE public.tickets RENAME COLUMN related_subscription_id TO related_subscription_id_old;
ALTER TABLE public.tickets RENAME COLUMN related_subscription_id_uuid TO related_subscription_id;

ALTER TABLE public.partner_payouts RENAME COLUMN id TO id_old;
ALTER TABLE public.partner_payouts RENAME COLUMN id_uuid TO id;
ALTER TABLE public.partner_payouts RENAME COLUMN partner_id TO partner_id_old;
ALTER TABLE public.partner_payouts RENAME COLUMN partner_id_uuid TO partner_id;
ALTER TABLE public.partner_payouts RENAME COLUMN processed_by_user_id TO processed_by_user_id_old;
ALTER TABLE public.partner_payouts RENAME COLUMN processed_by_user_id_uuid TO processed_by_user_id;

ALTER TABLE public.connection_requests RENAME COLUMN id TO id_old;
ALTER TABLE public.connection_requests RENAME COLUMN id_uuid TO id;
ALTER TABLE public.connection_requests RENAME COLUMN coverage_zone_id TO coverage_zone_id_old;
ALTER TABLE public.connection_requests RENAME COLUMN coverage_zone_id_uuid TO coverage_zone_id;

-- Уровень 4
ALTER TABLE public.transactions RENAME COLUMN id TO id_old;
ALTER TABLE public.transactions RENAME COLUMN id_uuid TO id;
ALTER TABLE public.transactions RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.transactions RENAME COLUMN account_id_uuid TO account_id;
ALTER TABLE public.transactions RENAME COLUMN subscription_id TO subscription_id_old;
ALTER TABLE public.transactions RENAME COLUMN subscription_id_uuid TO subscription_id;
ALTER TABLE public.transactions RENAME COLUMN payment_id TO payment_id_old;
ALTER TABLE public.transactions RENAME COLUMN payment_id_uuid TO payment_id;
ALTER TABLE public.transactions RENAME COLUMN invoice_id TO invoice_id_old;
ALTER TABLE public.transactions RENAME COLUMN invoice_id_uuid TO invoice_id;

ALTER TABLE public.community_messages RENAME COLUMN id TO id_old;
ALTER TABLE public.community_messages RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_messages RENAME COLUMN room_id TO room_id_old;
ALTER TABLE public.community_messages RENAME COLUMN room_id_uuid TO room_id;
ALTER TABLE public.community_messages RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.community_messages RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.community_messages RENAME COLUMN deleted_by TO deleted_by_old;
ALTER TABLE public.community_messages RENAME COLUMN deleted_by_uuid TO deleted_by;
ALTER TABLE public.community_messages RENAME COLUMN reply_to_id TO reply_to_id_old;
ALTER TABLE public.community_messages RENAME COLUMN reply_to_id_uuid TO reply_to_id;

ALTER TABLE public.ticket_comments RENAME COLUMN id TO id_old;
ALTER TABLE public.ticket_comments RENAME COLUMN id_uuid TO id;
ALTER TABLE public.ticket_comments RENAME COLUMN ticket_id TO ticket_id_old;
ALTER TABLE public.ticket_comments RENAME COLUMN ticket_id_uuid TO ticket_id;

ALTER TABLE public.ticket_history RENAME COLUMN id TO id_old;
ALTER TABLE public.ticket_history RENAME COLUMN id_uuid TO id;
ALTER TABLE public.ticket_history RENAME COLUMN ticket_id TO ticket_id_old;
ALTER TABLE public.ticket_history RENAME COLUMN ticket_id_uuid TO ticket_id;

ALTER TABLE public.community_mutes RENAME COLUMN id TO id_old;
ALTER TABLE public.community_mutes RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_mutes RENAME COLUMN room_id TO room_id_old;
ALTER TABLE public.community_mutes RENAME COLUMN room_id_uuid TO room_id;
ALTER TABLE public.community_mutes RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.community_mutes RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.community_mutes RENAME COLUMN muted_by TO muted_by_old;
ALTER TABLE public.community_mutes RENAME COLUMN muted_by_uuid TO muted_by;

ALTER TABLE public.community_bans RENAME COLUMN id TO id_old;
ALTER TABLE public.community_bans RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_bans RENAME COLUMN room_id TO room_id_old;
ALTER TABLE public.community_bans RENAME COLUMN room_id_uuid TO room_id;
ALTER TABLE public.community_bans RENAME COLUMN user_id TO user_id_old;
ALTER TABLE public.community_bans RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE public.community_bans RENAME COLUMN banned_by TO banned_by_old;
ALTER TABLE public.community_bans RENAME COLUMN banned_by_uuid TO banned_by;

ALTER TABLE public.partner_referrals RENAME COLUMN id TO id_old;
ALTER TABLE public.partner_referrals RENAME COLUMN id_uuid TO id;
ALTER TABLE public.partner_referrals RENAME COLUMN partner_id TO partner_id_old;
ALTER TABLE public.partner_referrals RENAME COLUMN partner_id_uuid TO partner_id;
ALTER TABLE public.partner_referrals RENAME COLUMN account_id TO account_id_old;
ALTER TABLE public.partner_referrals RENAME COLUMN account_id_uuid TO account_id;
ALTER TABLE public.partner_referrals RENAME COLUMN coverage_zone_id TO coverage_zone_id_old;
ALTER TABLE public.partner_referrals RENAME COLUMN coverage_zone_id_uuid TO coverage_zone_id;

-- Уровень 5
ALTER TABLE public.community_reports RENAME COLUMN id TO id_old;
ALTER TABLE public.community_reports RENAME COLUMN id_uuid TO id;
ALTER TABLE public.community_reports RENAME COLUMN message_id TO message_id_old;
ALTER TABLE public.community_reports RENAME COLUMN message_id_uuid TO message_id;
ALTER TABLE public.community_reports RENAME COLUMN reported_by TO reported_by_old;
ALTER TABLE public.community_reports RENAME COLUMN reported_by_uuid TO reported_by;
ALTER TABLE public.community_reports RENAME COLUMN reviewed_by TO reviewed_by_old;
ALTER TABLE public.community_reports RENAME COLUMN reviewed_by_uuid TO reviewed_by;

ALTER TABLE public.partner_commissions RENAME COLUMN id TO id_old;
ALTER TABLE public.partner_commissions RENAME COLUMN id_uuid TO id;
ALTER TABLE public.partner_commissions RENAME COLUMN partner_id TO partner_id_old;
ALTER TABLE public.partner_commissions RENAME COLUMN partner_id_uuid TO partner_id;
ALTER TABLE public.partner_commissions RENAME COLUMN referral_id TO referral_id_old;
ALTER TABLE public.partner_commissions RENAME COLUMN referral_id_uuid TO referral_id;
ALTER TABLE public.partner_commissions RENAME COLUMN payout_id TO payout_id_old;
ALTER TABLE public.partner_commissions RENAME COLUMN payout_id_uuid TO payout_id;

-- =====================================================
-- ЧАСТЬ 4: Добавление новых PK constraints
-- =====================================================

ALTER TABLE public.service_categories ADD PRIMARY KEY (id);
ALTER TABLE public.tv_channel_categories ADD PRIMARY KEY (id);
ALTER TABLE public.site_content ADD PRIMARY KEY (id);
ALTER TABLE public.community_rooms ADD PRIMARY KEY (id);
ALTER TABLE public.users ADD PRIMARY KEY (id);
ALTER TABLE public.services ADD PRIMARY KEY (id);
ALTER TABLE public.news ADD PRIMARY KEY (id);
ALTER TABLE public.coverage_zones ADD PRIMARY KEY (id);
ALTER TABLE public.accounts ADD PRIMARY KEY (id);
ALTER TABLE public.partners ADD PRIMARY KEY (id);
ALTER TABLE public.achievements ADD PRIMARY KEY (id);
ALTER TABLE public.referral_codes ADD PRIMARY KEY (id);
ALTER TABLE public.news_attachments ADD PRIMARY KEY (id);
ALTER TABLE public.chats ADD PRIMARY KEY (id);
ALTER TABLE public.notification_settings ADD PRIMARY KEY (id);
ALTER TABLE public.callback_requests ADD PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD PRIMARY KEY (id);
ALTER TABLE public.payments ADD PRIMARY KEY (id);
ALTER TABLE public.invoices ADD PRIMARY KEY (id);
ALTER TABLE public.auth_sessions ADD PRIMARY KEY (id);
ALTER TABLE public.referrals ADD PRIMARY KEY (id);
ALTER TABLE public.partner_coverage_zones ADD PRIMARY KEY (id);
ALTER TABLE public.community_members ADD PRIMARY KEY (id);
ALTER TABLE public.chat_messages ADD PRIMARY KEY (id);
ALTER TABLE public.tickets ADD PRIMARY KEY (id);
ALTER TABLE public.partner_payouts ADD PRIMARY KEY (id);
ALTER TABLE public.connection_requests ADD PRIMARY KEY (id);
ALTER TABLE public.transactions ADD PRIMARY KEY (id);
ALTER TABLE public.community_messages ADD PRIMARY KEY (id);
ALTER TABLE public.ticket_comments ADD PRIMARY KEY (id);
ALTER TABLE public.ticket_history ADD PRIMARY KEY (id);
ALTER TABLE public.community_mutes ADD PRIMARY KEY (id);
ALTER TABLE public.community_bans ADD PRIMARY KEY (id);
ALTER TABLE public.partner_referrals ADD PRIMARY KEY (id);
ALTER TABLE public.community_reports ADD PRIMARY KEY (id);
ALTER TABLE public.partner_commissions ADD PRIMARY KEY (id);

-- =====================================================
-- ЧАСТЬ 5: Добавление новых FK constraints
-- Порядок: от независимых к зависимым
-- =====================================================

-- Уровень 0 (self-ref)
ALTER TABLE public.community_rooms
  ADD CONSTRAINT community_rooms_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES public.community_rooms(id) ON DELETE SET NULL;

-- Уровень 1
ALTER TABLE public.services
  ADD CONSTRAINT services_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE SET NULL;

ALTER TABLE public.coverage_zones
  ADD CONSTRAINT coverage_zones_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- Уровень 2
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.partners
  ADD CONSTRAINT partners_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.news_attachments
  ADD CONSTRAINT news_attachments_news_id_fkey
  FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;

ALTER TABLE public.chats
  ADD CONSTRAINT chats_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.chats
  ADD CONSTRAINT chats_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.chats
  ADD CONSTRAINT chats_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users(id);

ALTER TABLE public.notification_settings
  ADD CONSTRAINT notification_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.callback_requests
  ADD CONSTRAINT callback_requests_processed_by_fkey
  FOREIGN KEY (processed_by) REFERENCES public.users(id);

-- Уровень 3
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES public.services(id);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.auth_sessions
  ADD CONSTRAINT auth_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.auth_sessions
  ADD CONSTRAINT auth_sessions_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_referral_code_id_fkey
  FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id);

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id) REFERENCES public.users(id);

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_invitee_user_id_fkey
  FOREIGN KEY (invitee_user_id) REFERENCES public.users(id);

ALTER TABLE public.partner_coverage_zones
  ADD CONSTRAINT partner_coverage_zones_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.community_members
  ADD CONSTRAINT community_members_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES public.community_rooms(id) ON DELETE CASCADE;

ALTER TABLE public.community_members
  ADD CONSTRAINT community_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_members
  ADD CONSTRAINT community_members_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_chat_id_fkey
  FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.users(id);

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_related_service_id_fkey
  FOREIGN KEY (related_service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_related_subscription_id_fkey
  FOREIGN KEY (related_subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.partner_payouts
  ADD CONSTRAINT partner_payouts_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.partner_payouts
  ADD CONSTRAINT partner_payouts_processed_by_user_id_fkey
  FOREIGN KEY (processed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.connection_requests
  ADD CONSTRAINT connection_requests_coverage_zone_id_fkey
  FOREIGN KEY (coverage_zone_id) REFERENCES public.partner_coverage_zones(id);

-- Уровень 4
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_id_fkey
  FOREIGN KEY (payment_id) REFERENCES public.payments(id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);

ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES public.community_rooms(id) ON DELETE CASCADE;

ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES public.users(id);

ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_reply_to_id_fkey
  FOREIGN KEY (reply_to_id) REFERENCES public.community_messages(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_comments
  ADD CONSTRAINT ticket_comments_ticket_id_fkey
  FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_history
  ADD CONSTRAINT ticket_history_ticket_id_fkey
  FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

ALTER TABLE public.community_mutes
  ADD CONSTRAINT community_mutes_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES public.community_rooms(id) ON DELETE CASCADE;

ALTER TABLE public.community_mutes
  ADD CONSTRAINT community_mutes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_mutes
  ADD CONSTRAINT community_mutes_muted_by_fkey
  FOREIGN KEY (muted_by) REFERENCES public.users(id);

ALTER TABLE public.community_bans
  ADD CONSTRAINT community_bans_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES public.community_rooms(id) ON DELETE CASCADE;

ALTER TABLE public.community_bans
  ADD CONSTRAINT community_bans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_bans
  ADD CONSTRAINT community_bans_banned_by_fkey
  FOREIGN KEY (banned_by) REFERENCES public.users(id);

ALTER TABLE public.partner_referrals
  ADD CONSTRAINT partner_referrals_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.partner_referrals
  ADD CONSTRAINT partner_referrals_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

ALTER TABLE public.partner_referrals
  ADD CONSTRAINT partner_referrals_coverage_zone_id_fkey
  FOREIGN KEY (coverage_zone_id) REFERENCES public.partner_coverage_zones(id) ON DELETE SET NULL;

-- Уровень 5
ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_message_id_fkey
  FOREIGN KEY (message_id) REFERENCES public.community_messages(id) ON DELETE CASCADE;

ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES public.users(id);

ALTER TABLE public.community_reports
  ADD CONSTRAINT community_reports_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

ALTER TABLE public.partner_commissions
  ADD CONSTRAINT partner_commissions_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE public.partner_commissions
  ADD CONSTRAINT partner_commissions_referral_id_fkey
  FOREIGN KEY (referral_id) REFERENCES public.partner_referrals(id) ON DELETE CASCADE;

ALTER TABLE public.partner_commissions
  ADD CONSTRAINT partner_commissions_payout_id_fkey
  FOREIGN KEY (payout_id) REFERENCES public.partner_payouts(id) ON DELETE SET NULL;

-- =====================================================
-- ЧАСТЬ 6: Включение триггеров обратно
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- КОММИТ ТРАНЗАКЦИИ
-- =====================================================
COMMIT;

-- =====================================================
-- POST-MIGRATION: Обновление функций, использующих bigint
-- =====================================================

-- check_point_in_coverage: обновление возвращаемого типа
CREATE OR REPLACE FUNCTION public.check_point_in_coverage(
  lat numeric,
  lon numeric
)
RETURNS TABLE (
  in_coverage boolean,
  zone_id uuid,
  zone_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
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

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text;
  END IF;
END;
$$;

-- =====================================================
-- Комментарии к новым колонкам
-- =====================================================

COMMENT ON COLUMN public.users.id IS 'UUID первичный ключ';
COMMENT ON COLUMN public.users.id_old IS 'Старый bigint ID (для обратной совместимости)';

COMMENT ON COLUMN public.accounts.id IS 'UUID первичный ключ';
COMMENT ON COLUMN public.accounts.user_id IS 'UUID FK на users';

-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- ⚠️  ВНИМАНИЕ: Это полный откат миграции!
-- Рекомендуется восстановление из бэкапа: pg_restore -d dbname backup_before_uuid.dump

BEGIN;

SET session_replication_role = replica;

-- 1. Удаление FK constraints (новые)
-- [Перечислить все FK из ЧАСТИ 5 с DROP CONSTRAINT]

-- 2. Удаление PK constraints (новые)
-- [Перечислить все PK из ЧАСТИ 4 с DROP CONSTRAINT]

-- 3. Переименование колонок обратно
-- id → id_uuid, id_old → id (для всех таблиц)

-- 4. Добавление старых PK constraints
-- [Восстановить из оригинальных миграций]

-- 5. Добавление старых FK constraints
-- [Восстановить из оригинальных миграций]

SET session_replication_role = DEFAULT;

COMMIT;
*/

