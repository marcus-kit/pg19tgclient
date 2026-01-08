-- 040_cleanup_all_old_columns.sql
-- Полная очистка всех _old колонок после UUID миграции

-- ========================================
-- accounts
-- ========================================
ALTER TABLE public.accounts DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.accounts DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- achievements
-- ========================================
ALTER TABLE public.achievements DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.achievements DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- auth_sessions
-- ========================================
ALTER TABLE public.auth_sessions DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.auth_sessions DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.auth_sessions DROP COLUMN IF EXISTS account_id_old CASCADE;

-- ========================================
-- callback_requests
-- ========================================
ALTER TABLE public.callback_requests DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.callback_requests DROP COLUMN IF EXISTS processed_by_old CASCADE;

-- ========================================
-- community_bans
-- ========================================
ALTER TABLE public.community_bans DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_bans DROP COLUMN IF EXISTS room_id_old CASCADE;
ALTER TABLE public.community_bans DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.community_bans DROP COLUMN IF EXISTS banned_by_old CASCADE;

-- ========================================
-- community_members
-- ========================================
ALTER TABLE public.community_members DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_members DROP COLUMN IF EXISTS room_id_old CASCADE;
ALTER TABLE public.community_members DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.community_members DROP COLUMN IF EXISTS account_id_old CASCADE;

-- ========================================
-- community_messages
-- ========================================
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS room_id_old CASCADE;
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS deleted_by_old CASCADE;
ALTER TABLE public.community_messages DROP COLUMN IF EXISTS reply_to_id_old CASCADE;

-- ========================================
-- community_mutes
-- ========================================
ALTER TABLE public.community_mutes DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_mutes DROP COLUMN IF EXISTS room_id_old CASCADE;
ALTER TABLE public.community_mutes DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.community_mutes DROP COLUMN IF EXISTS muted_by_old CASCADE;

-- ========================================
-- community_reports
-- ========================================
ALTER TABLE public.community_reports DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_reports DROP COLUMN IF EXISTS message_id_old CASCADE;
ALTER TABLE public.community_reports DROP COLUMN IF EXISTS reported_by_old CASCADE;
ALTER TABLE public.community_reports DROP COLUMN IF EXISTS reviewed_by_old CASCADE;

-- ========================================
-- community_rooms
-- ========================================
ALTER TABLE public.community_rooms DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.community_rooms DROP COLUMN IF EXISTS parent_id_old CASCADE;

-- ========================================
-- invoices
-- ========================================
ALTER TABLE public.invoices DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS account_id_old CASCADE;

-- ========================================
-- news
-- ========================================
ALTER TABLE public.news DROP COLUMN IF EXISTS id_old CASCADE;

-- ========================================
-- news_attachments
-- ========================================
ALTER TABLE public.news_attachments DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.news_attachments DROP COLUMN IF EXISTS news_id_old CASCADE;

-- ========================================
-- notification_settings
-- ========================================
ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- partner_commissions (уже очищена в 038)
-- ========================================
ALTER TABLE public.partner_commissions DROP COLUMN IF EXISTS payout_id_old CASCADE;

-- ========================================
-- partner_payouts
-- ========================================
ALTER TABLE public.partner_payouts DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.partner_payouts DROP COLUMN IF EXISTS partner_id_old CASCADE;
ALTER TABLE public.partner_payouts DROP COLUMN IF EXISTS processed_by_user_id_old CASCADE;

-- ========================================
-- partner_referrals (уже очищена в 038)
-- ========================================
ALTER TABLE public.partner_referrals DROP COLUMN IF EXISTS account_id_old CASCADE;

-- ========================================
-- partners (уже очищена в 038)
-- ========================================
ALTER TABLE public.partners DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- payments
-- ========================================
ALTER TABLE public.payments DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.payments DROP COLUMN IF EXISTS account_id_old CASCADE;

-- ========================================
-- referral_codes
-- ========================================
ALTER TABLE public.referral_codes DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.referral_codes DROP COLUMN IF EXISTS user_id_old CASCADE;

-- ========================================
-- referrals
-- ========================================
ALTER TABLE public.referrals DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.referrals DROP COLUMN IF EXISTS inviter_user_id_old CASCADE;
ALTER TABLE public.referrals DROP COLUMN IF EXISTS invitee_user_id_old CASCADE;
ALTER TABLE public.referrals DROP COLUMN IF EXISTS referral_code_id_old CASCADE;

-- ========================================
-- service_categories
-- ========================================
ALTER TABLE public.service_categories DROP COLUMN IF EXISTS id_old CASCADE;

-- ========================================
-- services
-- ========================================
ALTER TABLE public.services DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.services DROP COLUMN IF EXISTS category_id_old CASCADE;

-- ========================================
-- site_content
-- ========================================
ALTER TABLE public.site_content DROP COLUMN IF EXISTS id_old CASCADE;

-- ========================================
-- subscriptions
-- ========================================
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS account_id_old CASCADE;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS service_id_old CASCADE;

-- ========================================
-- ticket_comments
-- ========================================
ALTER TABLE public.ticket_comments DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.ticket_comments DROP COLUMN IF EXISTS ticket_id_old CASCADE;

-- ========================================
-- ticket_history
-- ========================================
ALTER TABLE public.ticket_history DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.ticket_history DROP COLUMN IF EXISTS ticket_id_old CASCADE;

-- ========================================
-- tickets
-- ========================================
ALTER TABLE public.tickets DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS user_id_old CASCADE;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS related_service_id_old CASCADE;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS related_subscription_id_old CASCADE;

-- ========================================
-- transactions
-- ========================================
ALTER TABLE public.transactions DROP COLUMN IF EXISTS id_old CASCADE;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS account_id_old CASCADE;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS invoice_id_old CASCADE;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS payment_id_old CASCADE;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS subscription_id_old CASCADE;

-- ========================================
-- tv_channel_categories
-- ========================================
ALTER TABLE public.tv_channel_categories DROP COLUMN IF EXISTS id_old CASCADE;

-- ========================================
-- users
-- ========================================
ALTER TABLE public.users DROP COLUMN IF EXISTS id_old CASCADE;
