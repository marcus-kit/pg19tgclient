-- Migration: 033_uuid_data.sql
-- Description: Заполнение UUID данных для всех таблиц (Фаза 2 из 3)
-- Created: 2026-01-08
--
-- ВАЖНО: Эта миграция НЕ требует downtime!
-- Заполняет id_uuid для существующих записей и синхронизирует FK ссылки.
--
-- Порядок выполнения:
--   032_uuid_prep.sql → добавление колонок
--   033_uuid_data.sql → заполнение UUID данных (эта миграция)
--   034_uuid_finalize.sql → переключение PK/FK (требует maintenance window)

-- =====================================================
-- ЧАСТЬ 1: Генерация UUID для id_uuid колонок
-- (если DEFAULT не сработал для существующих записей)
-- =====================================================

-- Уровень 0
UPDATE public.service_categories SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.tv_channel_categories SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.site_content SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.community_rooms SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Уровень 1
UPDATE public.users SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.services SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.news SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.coverage_zones SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Уровень 2
UPDATE public.accounts SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.partners SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.achievements SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.referral_codes SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.news_attachments SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.chats SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.notification_settings SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.callback_requests SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Уровень 3
UPDATE public.subscriptions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.payments SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.invoices SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.auth_sessions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.referrals SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.partner_coverage_zones SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.community_members SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.chat_messages SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.tickets SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.partner_payouts SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.connection_requests SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Уровень 4
UPDATE public.transactions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.community_messages SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.ticket_comments SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.ticket_history SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.community_mutes SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.community_bans SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.partner_referrals SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Уровень 5
UPDATE public.community_reports SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
UPDATE public.partner_commissions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- =====================================================
-- ЧАСТЬ 2: Синхронизация FK ссылок (UUID)
-- Порядок: от независимых к зависимым
-- =====================================================

-- Self-reference: community_rooms.parent_id_uuid
UPDATE public.community_rooms cr
SET parent_id_uuid = parent.id_uuid
FROM public.community_rooms parent
WHERE cr.parent_id = parent.id
  AND cr.parent_id_uuid IS NULL;

-- services.category_id_uuid → service_categories
UPDATE public.services s
SET category_id_uuid = sc.id_uuid
FROM public.service_categories sc
WHERE s.category_id = sc.id
  AND s.category_id_uuid IS NULL;

-- coverage_zones.partner_id_uuid → partners
UPDATE public.coverage_zones cz
SET partner_id_uuid = p.id_uuid
FROM public.partners p
WHERE cz.partner_id = p.id
  AND cz.partner_id_uuid IS NULL;

-- accounts.user_id_uuid → users
UPDATE public.accounts a
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE a.user_id = u.id
  AND a.user_id_uuid IS NULL;

-- partners.user_id_uuid → users
UPDATE public.partners p
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE p.user_id = u.id
  AND p.user_id_uuid IS NULL;

-- achievements.user_id_uuid → users
UPDATE public.achievements ach
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE ach.user_id = u.id
  AND ach.user_id_uuid IS NULL;

-- referral_codes.user_id_uuid → users
UPDATE public.referral_codes rc
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE rc.user_id = u.id
  AND rc.user_id_uuid IS NULL;

-- news_attachments.news_id_uuid → news
UPDATE public.news_attachments na
SET news_id_uuid = n.id_uuid
FROM public.news n
WHERE na.news_id = n.id
  AND na.news_id_uuid IS NULL;

-- chats FK: user_id, account_id, assigned_to
UPDATE public.chats c
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE c.user_id = u.id
  AND c.user_id_uuid IS NULL;

UPDATE public.chats c
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE c.account_id = a.id
  AND c.account_id_uuid IS NULL;

UPDATE public.chats c
SET assigned_to_uuid = u.id_uuid
FROM public.users u
WHERE c.assigned_to = u.id
  AND c.assigned_to_uuid IS NULL;

-- notification_settings.user_id_uuid → users
UPDATE public.notification_settings ns
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE ns.user_id = u.id
  AND ns.user_id_uuid IS NULL;

-- callback_requests.processed_by_uuid → users
UPDATE public.callback_requests cr
SET processed_by_uuid = u.id_uuid
FROM public.users u
WHERE cr.processed_by = u.id
  AND cr.processed_by_uuid IS NULL;

-- subscriptions FK: account_id, service_id
UPDATE public.subscriptions sub
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE sub.account_id = a.id
  AND sub.account_id_uuid IS NULL;

UPDATE public.subscriptions sub
SET service_id_uuid = s.id_uuid
FROM public.services s
WHERE sub.service_id = s.id
  AND sub.service_id_uuid IS NULL;

-- payments.account_id_uuid → accounts
UPDATE public.payments p
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE p.account_id = a.id
  AND p.account_id_uuid IS NULL;

-- invoices.account_id_uuid → accounts
UPDATE public.invoices i
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE i.account_id = a.id
  AND i.account_id_uuid IS NULL;

-- auth_sessions FK: user_id, account_id
UPDATE public.auth_sessions ses
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE ses.user_id = u.id
  AND ses.user_id_uuid IS NULL;

UPDATE public.auth_sessions ses
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE ses.account_id = a.id
  AND ses.account_id_uuid IS NULL;

-- referrals FK: referral_code_id, inviter_user_id, invitee_user_id
UPDATE public.referrals r
SET referral_code_id_uuid = rc.id_uuid
FROM public.referral_codes rc
WHERE r.referral_code_id = rc.id
  AND r.referral_code_id_uuid IS NULL;

UPDATE public.referrals r
SET inviter_user_id_uuid = u.id_uuid
FROM public.users u
WHERE r.inviter_user_id = u.id
  AND r.inviter_user_id_uuid IS NULL;

UPDATE public.referrals r
SET invitee_user_id_uuid = u.id_uuid
FROM public.users u
WHERE r.invitee_user_id = u.id
  AND r.invitee_user_id_uuid IS NULL;

-- partner_coverage_zones.partner_id_uuid → partners
UPDATE public.partner_coverage_zones pcz
SET partner_id_uuid = p.id_uuid
FROM public.partners p
WHERE pcz.partner_id = p.id
  AND pcz.partner_id_uuid IS NULL;

-- community_members FK: room_id, user_id, account_id
UPDATE public.community_members cm
SET room_id_uuid = cr.id_uuid
FROM public.community_rooms cr
WHERE cm.room_id = cr.id
  AND cm.room_id_uuid IS NULL;

UPDATE public.community_members cm
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE cm.user_id = u.id
  AND cm.user_id_uuid IS NULL;

UPDATE public.community_members cm
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE cm.account_id = a.id
  AND cm.account_id_uuid IS NULL;

-- chat_messages FK: chat_id, sender_id
UPDATE public.chat_messages msg
SET chat_id_uuid = c.id_uuid
FROM public.chats c
WHERE msg.chat_id = c.id
  AND msg.chat_id_uuid IS NULL;

UPDATE public.chat_messages msg
SET sender_id_uuid = u.id_uuid
FROM public.users u
WHERE msg.sender_id = u.id
  AND msg.sender_id_uuid IS NULL;

-- tickets FK: user_id, related_service_id, related_subscription_id
UPDATE public.tickets t
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE t.user_id = u.id
  AND t.user_id_uuid IS NULL;

UPDATE public.tickets t
SET related_service_id_uuid = s.id_uuid
FROM public.services s
WHERE t.related_service_id = s.id
  AND t.related_service_id_uuid IS NULL;

UPDATE public.tickets t
SET related_subscription_id_uuid = sub.id_uuid
FROM public.subscriptions sub
WHERE t.related_subscription_id = sub.id
  AND t.related_subscription_id_uuid IS NULL;

-- partner_payouts FK: partner_id, processed_by_user_id
UPDATE public.partner_payouts pp
SET partner_id_uuid = p.id_uuid
FROM public.partners p
WHERE pp.partner_id = p.id
  AND pp.partner_id_uuid IS NULL;

UPDATE public.partner_payouts pp
SET processed_by_user_id_uuid = u.id_uuid
FROM public.users u
WHERE pp.processed_by_user_id = u.id
  AND pp.processed_by_user_id_uuid IS NULL;

-- connection_requests.coverage_zone_id_uuid → partner_coverage_zones
UPDATE public.connection_requests cr
SET coverage_zone_id_uuid = pcz.id_uuid
FROM public.partner_coverage_zones pcz
WHERE cr.coverage_zone_id = pcz.id
  AND cr.coverage_zone_id_uuid IS NULL;

-- transactions FK: account_id, subscription_id, payment_id, invoice_id
UPDATE public.transactions tx
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE tx.account_id = a.id
  AND tx.account_id_uuid IS NULL;

UPDATE public.transactions tx
SET subscription_id_uuid = sub.id_uuid
FROM public.subscriptions sub
WHERE tx.subscription_id = sub.id
  AND tx.subscription_id_uuid IS NULL;

UPDATE public.transactions tx
SET payment_id_uuid = p.id_uuid
FROM public.payments p
WHERE tx.payment_id = p.id
  AND tx.payment_id_uuid IS NULL;

UPDATE public.transactions tx
SET invoice_id_uuid = i.id_uuid
FROM public.invoices i
WHERE tx.invoice_id = i.id
  AND tx.invoice_id_uuid IS NULL;

-- community_messages FK: room_id, user_id, deleted_by, reply_to_id
UPDATE public.community_messages cm
SET room_id_uuid = cr.id_uuid
FROM public.community_rooms cr
WHERE cm.room_id = cr.id
  AND cm.room_id_uuid IS NULL;

UPDATE public.community_messages cm
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE cm.user_id = u.id
  AND cm.user_id_uuid IS NULL;

UPDATE public.community_messages cm
SET deleted_by_uuid = u.id_uuid
FROM public.users u
WHERE cm.deleted_by = u.id
  AND cm.deleted_by_uuid IS NULL;

-- Self-reference: community_messages.reply_to_id_uuid
UPDATE public.community_messages cm
SET reply_to_id_uuid = parent.id_uuid
FROM public.community_messages parent
WHERE cm.reply_to_id = parent.id
  AND cm.reply_to_id_uuid IS NULL;

-- ticket_comments.ticket_id_uuid → tickets
UPDATE public.ticket_comments tc
SET ticket_id_uuid = t.id_uuid
FROM public.tickets t
WHERE tc.ticket_id = t.id
  AND tc.ticket_id_uuid IS NULL;

-- ticket_history.ticket_id_uuid → tickets
UPDATE public.ticket_history th
SET ticket_id_uuid = t.id_uuid
FROM public.tickets t
WHERE th.ticket_id = t.id
  AND th.ticket_id_uuid IS NULL;

-- community_mutes FK: room_id, user_id, muted_by
UPDATE public.community_mutes cm
SET room_id_uuid = cr.id_uuid
FROM public.community_rooms cr
WHERE cm.room_id = cr.id
  AND cm.room_id_uuid IS NULL;

UPDATE public.community_mutes cm
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE cm.user_id = u.id
  AND cm.user_id_uuid IS NULL;

UPDATE public.community_mutes cm
SET muted_by_uuid = u.id_uuid
FROM public.users u
WHERE cm.muted_by = u.id
  AND cm.muted_by_uuid IS NULL;

-- community_bans FK: room_id, user_id, banned_by
UPDATE public.community_bans cb
SET room_id_uuid = cr.id_uuid
FROM public.community_rooms cr
WHERE cb.room_id = cr.id
  AND cb.room_id_uuid IS NULL;

UPDATE public.community_bans cb
SET user_id_uuid = u.id_uuid
FROM public.users u
WHERE cb.user_id = u.id
  AND cb.user_id_uuid IS NULL;

UPDATE public.community_bans cb
SET banned_by_uuid = u.id_uuid
FROM public.users u
WHERE cb.banned_by = u.id
  AND cb.banned_by_uuid IS NULL;

-- partner_referrals FK: partner_id, account_id, coverage_zone_id
UPDATE public.partner_referrals pr
SET partner_id_uuid = p.id_uuid
FROM public.partners p
WHERE pr.partner_id = p.id
  AND pr.partner_id_uuid IS NULL;

UPDATE public.partner_referrals pr
SET account_id_uuid = a.id_uuid
FROM public.accounts a
WHERE pr.account_id = a.id
  AND pr.account_id_uuid IS NULL;

UPDATE public.partner_referrals pr
SET coverage_zone_id_uuid = pcz.id_uuid
FROM public.partner_coverage_zones pcz
WHERE pr.coverage_zone_id = pcz.id
  AND pr.coverage_zone_id_uuid IS NULL;

-- community_reports FK: message_id, reported_by, reviewed_by
UPDATE public.community_reports cr
SET message_id_uuid = cm.id_uuid
FROM public.community_messages cm
WHERE cr.message_id = cm.id
  AND cr.message_id_uuid IS NULL;

UPDATE public.community_reports cr
SET reported_by_uuid = u.id_uuid
FROM public.users u
WHERE cr.reported_by = u.id
  AND cr.reported_by_uuid IS NULL;

UPDATE public.community_reports cr
SET reviewed_by_uuid = u.id_uuid
FROM public.users u
WHERE cr.reviewed_by = u.id
  AND cr.reviewed_by_uuid IS NULL;

-- partner_commissions FK: partner_id, referral_id, payout_id
UPDATE public.partner_commissions pc
SET partner_id_uuid = p.id_uuid
FROM public.partners p
WHERE pc.partner_id = p.id
  AND pc.partner_id_uuid IS NULL;

UPDATE public.partner_commissions pc
SET referral_id_uuid = pr.id_uuid
FROM public.partner_referrals pr
WHERE pc.referral_id = pr.id
  AND pc.referral_id_uuid IS NULL;

UPDATE public.partner_commissions pc
SET payout_id_uuid = pp.id_uuid
FROM public.partner_payouts pp
WHERE pc.payout_id = pp.id
  AND pc.payout_id_uuid IS NULL;

-- =====================================================
-- ЧАСТЬ 3: Верификация данных
-- =====================================================

-- Функция проверки: все id_uuid должны быть заполнены
DO $$
DECLARE
  v_table text;
  v_count bigint;
  v_tables text[] := ARRAY[
    'service_categories', 'tv_channel_categories', 'site_content', 'community_rooms',
    'users', 'services', 'news', 'coverage_zones',
    'accounts', 'partners', 'achievements', 'referral_codes', 'news_attachments',
    'chats', 'notification_settings', 'callback_requests',
    'subscriptions', 'payments', 'invoices', 'auth_sessions', 'referrals',
    'partner_coverage_zones', 'community_members', 'chat_messages', 'tickets',
    'partner_payouts', 'connection_requests',
    'transactions', 'community_messages', 'ticket_comments', 'ticket_history',
    'community_mutes', 'community_bans', 'partner_referrals',
    'community_reports', 'partner_commissions'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE id_uuid IS NULL', v_table) INTO v_count;
    IF v_count > 0 THEN
      RAISE WARNING 'Table % has % rows with NULL id_uuid', v_table, v_count;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- Комментарий
-- =====================================================

COMMENT ON COLUMN public.users.id_uuid IS 'UUID заполнен, готов к переключению в 034';
COMMENT ON COLUMN public.accounts.id_uuid IS 'UUID заполнен, готов к переключению в 034';

-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- Сброс UUID данных (если нужно повторить миграцию)
-- ВНИМАНИЕ: Это удалит все сгенерированные UUID!

-- Уровень 5
UPDATE public.partner_commissions SET partner_id_uuid = NULL, referral_id_uuid = NULL, payout_id_uuid = NULL;
UPDATE public.community_reports SET message_id_uuid = NULL, reported_by_uuid = NULL, reviewed_by_uuid = NULL;

-- Уровень 4
UPDATE public.partner_referrals SET partner_id_uuid = NULL, account_id_uuid = NULL, coverage_zone_id_uuid = NULL;
UPDATE public.community_bans SET room_id_uuid = NULL, user_id_uuid = NULL, banned_by_uuid = NULL;
UPDATE public.community_mutes SET room_id_uuid = NULL, user_id_uuid = NULL, muted_by_uuid = NULL;
UPDATE public.ticket_history SET ticket_id_uuid = NULL;
UPDATE public.ticket_comments SET ticket_id_uuid = NULL;
UPDATE public.community_messages SET room_id_uuid = NULL, user_id_uuid = NULL, deleted_by_uuid = NULL, reply_to_id_uuid = NULL;
UPDATE public.transactions SET account_id_uuid = NULL, subscription_id_uuid = NULL, payment_id_uuid = NULL, invoice_id_uuid = NULL;

-- Уровень 3
UPDATE public.connection_requests SET coverage_zone_id_uuid = NULL;
UPDATE public.partner_payouts SET partner_id_uuid = NULL, processed_by_user_id_uuid = NULL;
UPDATE public.tickets SET user_id_uuid = NULL, related_service_id_uuid = NULL, related_subscription_id_uuid = NULL;
UPDATE public.chat_messages SET chat_id_uuid = NULL, sender_id_uuid = NULL;
UPDATE public.community_members SET room_id_uuid = NULL, user_id_uuid = NULL, account_id_uuid = NULL;
UPDATE public.partner_coverage_zones SET partner_id_uuid = NULL;
UPDATE public.referrals SET referral_code_id_uuid = NULL, inviter_user_id_uuid = NULL, invitee_user_id_uuid = NULL;
UPDATE public.auth_sessions SET user_id_uuid = NULL, account_id_uuid = NULL;
UPDATE public.invoices SET account_id_uuid = NULL;
UPDATE public.payments SET account_id_uuid = NULL;
UPDATE public.subscriptions SET account_id_uuid = NULL, service_id_uuid = NULL;

-- Уровень 2
UPDATE public.callback_requests SET processed_by_uuid = NULL;
UPDATE public.notification_settings SET user_id_uuid = NULL;
UPDATE public.chats SET user_id_uuid = NULL, account_id_uuid = NULL, assigned_to_uuid = NULL;
UPDATE public.news_attachments SET news_id_uuid = NULL;
UPDATE public.referral_codes SET user_id_uuid = NULL;
UPDATE public.achievements SET user_id_uuid = NULL;
UPDATE public.partners SET user_id_uuid = NULL;
UPDATE public.accounts SET user_id_uuid = NULL;

-- Уровень 1
UPDATE public.coverage_zones SET partner_id_uuid = NULL;
UPDATE public.services SET category_id_uuid = NULL;

-- Уровень 0
UPDATE public.community_rooms SET parent_id_uuid = NULL;

-- id_uuid можно оставить или тоже сбросить (не рекомендуется)
*/

