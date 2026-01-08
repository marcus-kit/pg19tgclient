-- Migration: 031_add_comments.sql
-- Description: Добавление COMMENT на русском языке ко всем таблицам и колонкам
-- Created: 2026-01-08

-- =====================================================
-- USERS - Пользователи
-- =====================================================

COMMENT ON TABLE public.users IS 'Пользователи системы (физические лица)';
COMMENT ON COLUMN public.users.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN public.users.status IS 'Статус: active (активен), suspended (приостановлен), terminated (удалён)';
COMMENT ON COLUMN public.users.first_name IS 'Имя';
COMMENT ON COLUMN public.users.last_name IS 'Фамилия';
COMMENT ON COLUMN public.users.middle_name IS 'Отчество';
COMMENT ON COLUMN public.users.full_name IS 'Полное ФИО (кэш для поиска)';
COMMENT ON COLUMN public.users.email IS 'Email адрес';
COMMENT ON COLUMN public.users.phone IS 'Телефон в формате +7XXXXXXXXXX';
COMMENT ON COLUMN public.users.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN public.users.telegram_username IS 'Username в Telegram (без @)';
COMMENT ON COLUMN public.users.vk_id IS 'ID пользователя ВКонтакте';
COMMENT ON COLUMN public.users.avatar IS 'URL аватара пользователя';
COMMENT ON COLUMN public.users.birth_date IS 'Дата рождения';
COMMENT ON COLUMN public.users.passport_series IS 'Серия паспорта';
COMMENT ON COLUMN public.users.passport_number IS 'Номер паспорта';
COMMENT ON COLUMN public.users.reg_city IS 'Город регистрации';
COMMENT ON COLUMN public.users.reg_street IS 'Улица регистрации';
COMMENT ON COLUMN public.users.auth_uid IS 'UUID из Supabase Auth (auth.users.id)';
COMMENT ON COLUMN public.users.date_created IS 'Дата создания записи';
COMMENT ON COLUMN public.users.date_updated IS 'Дата последнего обновления';

-- =====================================================
-- ACCOUNTS - Лицевые счета
-- =====================================================

COMMENT ON TABLE public.accounts IS 'Лицевые счета (договоры) пользователей';
COMMENT ON COLUMN public.accounts.id IS 'Уникальный идентификатор лицевого счёта';
COMMENT ON COLUMN public.accounts.user_id IS 'FK на пользователя-владельца';
COMMENT ON COLUMN public.accounts.contract_number IS 'Номер договора';
COMMENT ON COLUMN public.accounts.balance IS 'Баланс в копейках (делить на 100 для рублей)';
COMMENT ON COLUMN public.accounts.credit_limit IS 'Кредитный лимит в копейках';
COMMENT ON COLUMN public.accounts.status IS 'Статус: active, blocked, closed';
COMMENT ON COLUMN public.accounts.contract_status IS 'Статус договора: draft, active, terminated, stopped';
COMMENT ON COLUMN public.accounts.address_city IS 'Город подключения';
COMMENT ON COLUMN public.accounts.address_street IS 'Улица подключения';
COMMENT ON COLUMN public.accounts.address_building IS 'Номер дома';
COMMENT ON COLUMN public.accounts.address_apartment IS 'Номер квартиры';
COMMENT ON COLUMN public.accounts.address_full IS 'Полный адрес подключения (кэш)';
COMMENT ON COLUMN public.accounts.tariff_name IS 'Название текущего тарифа (кэш)';
COMMENT ON COLUMN public.accounts.contract_signed_at IS 'Дата подписания договора';

-- =====================================================
-- SERVICES - Услуги и тарифы
-- =====================================================

COMMENT ON TABLE public.services IS 'Услуги и тарифы';
COMMENT ON COLUMN public.services.id IS 'Уникальный идентификатор услуги';
COMMENT ON COLUMN public.services.category_id IS 'FK на категорию услуги';
COMMENT ON COLUMN public.services.name IS 'Название услуги';
COMMENT ON COLUMN public.services.slug IS 'URL-friendly идентификатор (уникальный)';
COMMENT ON COLUMN public.services.price_monthly IS 'Ежемесячная стоимость в копейках';
COMMENT ON COLUMN public.services.price_connection IS 'Стоимость подключения в копейках';
COMMENT ON COLUMN public.services.description IS 'Описание услуги';
COMMENT ON COLUMN public.services.hero_title IS 'Заголовок для hero-секции страницы услуги';
COMMENT ON COLUMN public.services.hero_subtitle IS 'Подзаголовок для hero-секции';
COMMENT ON COLUMN public.services.features IS 'Особенности услуги [{icon, title, description}]';
COMMENT ON COLUMN public.services.icon IS 'Иконка услуги (heroicon или URL)';
COMMENT ON COLUMN public.services.color IS 'Цвет услуги (hex)';
COMMENT ON COLUMN public.services.equipment IS 'Оборудование [{name, description, price_monthly}]';
COMMENT ON COLUMN public.services.sort_order IS 'Порядок сортировки';
COMMENT ON COLUMN public.services.is_active IS 'Активна ли услуга (отображается на сайте)';

-- =====================================================
-- SUBSCRIPTIONS - Подписки
-- =====================================================

COMMENT ON TABLE public.subscriptions IS 'Подписки пользователей на услуги';
COMMENT ON COLUMN public.subscriptions.id IS 'Уникальный идентификатор подписки';
COMMENT ON COLUMN public.subscriptions.account_id IS 'FK на лицевой счёт';
COMMENT ON COLUMN public.subscriptions.service_id IS 'FK на услугу';
COMMENT ON COLUMN public.subscriptions.status IS 'Статус: active, paused, cancelled';
COMMENT ON COLUMN public.subscriptions.custom_price IS 'Индивидуальная цена в копейках (если отличается от тарифа)';
COMMENT ON COLUMN public.subscriptions.is_primary IS 'Основная подписка (определяет тариф аккаунта)';
COMMENT ON COLUMN public.subscriptions.activated_at IS 'Дата активации подписки';
COMMENT ON COLUMN public.subscriptions.expires_at IS 'Дата окончания подписки';

-- =====================================================
-- TRANSACTIONS - Транзакции
-- =====================================================

COMMENT ON TABLE public.transactions IS 'Финансовые транзакции по лицевым счетам';
COMMENT ON COLUMN public.transactions.id IS 'Уникальный идентификатор транзакции';
COMMENT ON COLUMN public.transactions.account_id IS 'FK на лицевой счёт';
COMMENT ON COLUMN public.transactions.type IS 'Тип: charge (списание), payment (пополнение), correction, refund, bonus';
COMMENT ON COLUMN public.transactions.amount IS 'Сумма транзакции в копейках';
COMMENT ON COLUMN public.transactions.balance_after IS 'Баланс после операции в копейках';
COMMENT ON COLUMN public.transactions.description IS 'Описание транзакции';
COMMENT ON COLUMN public.transactions.subscription_id IS 'FK на подписку (для списаний)';
COMMENT ON COLUMN public.transactions.payment_id IS 'FK на платёж (для пополнений)';
COMMENT ON COLUMN public.transactions.invoice_id IS 'FK на счёт';

-- =====================================================
-- PAYMENTS - Платежи
-- =====================================================

COMMENT ON TABLE public.payments IS 'Платежи от пользователей';
COMMENT ON COLUMN public.payments.id IS 'Уникальный идентификатор платежа';
COMMENT ON COLUMN public.payments.account_id IS 'FK на лицевой счёт';
COMMENT ON COLUMN public.payments.provider IS 'Платёжная система: yookassa, cloudpayments, sbp, cash, bank_transfer, terminal';
COMMENT ON COLUMN public.payments.status IS 'Статус: pending, succeeded, failed, refunded';
COMMENT ON COLUMN public.payments.amount IS 'Сумма платежа в копейках';
COMMENT ON COLUMN public.payments.external_id IS 'ID платежа во внешней системе';
COMMENT ON COLUMN public.payments.metadata IS 'Дополнительные данные от платёжной системы';

-- =====================================================
-- INVOICES - Счета
-- =====================================================

COMMENT ON TABLE public.invoices IS 'Счета на оплату';
COMMENT ON COLUMN public.invoices.id IS 'Уникальный идентификатор счёта';
COMMENT ON COLUMN public.invoices.account_id IS 'FK на лицевой счёт';
COMMENT ON COLUMN public.invoices.invoice_number IS 'Номер счёта';
COMMENT ON COLUMN public.invoices.status IS 'Статус: draft, issued, paid, overdue, cancelled';
COMMENT ON COLUMN public.invoices.amount IS 'Сумма счёта в копейках';
COMMENT ON COLUMN public.invoices.due_date IS 'Срок оплаты';
COMMENT ON COLUMN public.invoices.paid_at IS 'Дата оплаты';

-- =====================================================
-- AUTH_SESSIONS - Сессии авторизации
-- =====================================================

COMMENT ON TABLE public.auth_sessions IS 'Сессии авторизации пользователей';
COMMENT ON COLUMN public.auth_sessions.id IS 'Уникальный идентификатор сессии';
COMMENT ON COLUMN public.auth_sessions.user_id IS 'FK на пользователя';
COMMENT ON COLUMN public.auth_sessions.account_id IS 'FK на лицевой счёт (выбранный при входе)';
COMMENT ON COLUMN public.auth_sessions.method IS 'Метод авторизации: contract, phone, email, telegram';
COMMENT ON COLUMN public.auth_sessions.verification_code IS 'Код подтверждения (SMS/email)';
COMMENT ON COLUMN public.auth_sessions.device IS 'Устройство (User-Agent)';
COMMENT ON COLUMN public.auth_sessions.browser IS 'Браузер';
COMMENT ON COLUMN public.auth_sessions.os IS 'Операционная система';
COMMENT ON COLUMN public.auth_sessions.ip_address IS 'IP адрес';
COMMENT ON COLUMN public.auth_sessions.location IS 'Геолокация по IP';
COMMENT ON COLUMN public.auth_sessions.last_active_at IS 'Время последней активности';
COMMENT ON COLUMN public.auth_sessions.is_active IS 'Активна ли сессия';

-- =====================================================
-- NEWS - Новости
-- =====================================================

COMMENT ON TABLE public.news IS 'Новости и объявления';
COMMENT ON COLUMN public.news.id IS 'Уникальный идентификатор новости';
COMMENT ON COLUMN public.news.title IS 'Заголовок новости';
COMMENT ON COLUMN public.news.summary IS 'Краткое описание (для списка)';
COMMENT ON COLUMN public.news.content IS 'Полный текст новости (HTML/Markdown)';
COMMENT ON COLUMN public.news.category IS 'Категория: announcement (объявление), protocol (протокол), notification (уведомление)';
COMMENT ON COLUMN public.news.status IS 'Статус: draft, published, archived';
COMMENT ON COLUMN public.news.published_at IS 'Дата публикации';
COMMENT ON COLUMN public.news.expires_at IS 'Дата истечения (для автоархивации)';
COMMENT ON COLUMN public.news.is_pinned IS 'Закреплённая новость (показывается вверху)';

-- =====================================================
-- NEWS_ATTACHMENTS - Вложения к новостям
-- =====================================================

COMMENT ON TABLE public.news_attachments IS 'Вложения к новостям (файлы, изображения)';
COMMENT ON COLUMN public.news_attachments.id IS 'Уникальный идентификатор вложения';
COMMENT ON COLUMN public.news_attachments.news_id IS 'FK на новость';
COMMENT ON COLUMN public.news_attachments.file_name IS 'Имя файла';
COMMENT ON COLUMN public.news_attachments.file_path IS 'DEPRECATED: старый путь к файлу';
COMMENT ON COLUMN public.news_attachments.storage_path IS 'Путь в Supabase Storage (bucket: news-attachments)';
COMMENT ON COLUMN public.news_attachments.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN public.news_attachments.mime_type IS 'MIME тип файла';
COMMENT ON COLUMN public.news_attachments.sort_order IS 'Порядок сортировки';

-- =====================================================
-- TV_CHANNEL_CATEGORIES - Категории ТВ
-- =====================================================

COMMENT ON TABLE public.tv_channel_categories IS 'Категории телевизионных каналов';
COMMENT ON COLUMN public.tv_channel_categories.id IS 'Уникальный идентификатор категории';
COMMENT ON COLUMN public.tv_channel_categories.name IS 'Название категории';
COMMENT ON COLUMN public.tv_channel_categories.slug IS 'URL-friendly идентификатор';
COMMENT ON COLUMN public.tv_channel_categories.icon IS 'Иконка категории';
COMMENT ON COLUMN public.tv_channel_categories.channel_count IS 'Количество каналов в категории';
COMMENT ON COLUMN public.tv_channel_categories.sort_order IS 'Порядок сортировки';
COMMENT ON COLUMN public.tv_channel_categories.is_active IS 'Активна ли категория';

-- =====================================================
-- SITE_CONTENT - CMS контент
-- =====================================================

COMMENT ON TABLE public.site_content IS 'CMS контент страниц сайта';
COMMENT ON COLUMN public.site_content.id IS 'Уникальный идентификатор записи';
COMMENT ON COLUMN public.site_content.page IS 'Идентификатор страницы: home, about, internet, tv, global';
COMMENT ON COLUMN public.site_content.section IS 'Секция страницы: hero, features, stats, pricing, contacts';
COMMENT ON COLUMN public.site_content.content IS 'JSONB контент секции';
COMMENT ON COLUMN public.site_content.version IS 'Версия контента';
COMMENT ON COLUMN public.site_content.is_active IS 'Активна ли версия';

-- =====================================================
-- REFERRAL_CODES - Реферальные коды
-- =====================================================

COMMENT ON TABLE public.referral_codes IS 'Реферальные коды пользователей';
COMMENT ON COLUMN public.referral_codes.id IS 'Уникальный идентификатор';
COMMENT ON COLUMN public.referral_codes.user_id IS 'FK на пользователя-владельца кода';
COMMENT ON COLUMN public.referral_codes.code IS 'Реферальный код (уникальный)';
COMMENT ON COLUMN public.referral_codes.inviter_bonus IS 'Бонус пригласившему в копейках';
COMMENT ON COLUMN public.referral_codes.invitee_bonus IS 'Бонус приглашённому в копейках';
COMMENT ON COLUMN public.referral_codes.total_invited IS 'Всего приглашённых пользователей';
COMMENT ON COLUMN public.referral_codes.total_bonus IS 'Всего начислено бонусов в копейках';
COMMENT ON COLUMN public.referral_codes.is_active IS 'Активен ли код';

-- =====================================================
-- REFERRALS - Приглашённые пользователи
-- =====================================================

COMMENT ON TABLE public.referrals IS 'Приглашённые пользователи (рефералы)';
COMMENT ON COLUMN public.referrals.id IS 'Уникальный идентификатор';
COMMENT ON COLUMN public.referrals.referral_code_id IS 'FK на реферальный код';
COMMENT ON COLUMN public.referrals.inviter_user_id IS 'FK на пригласившего пользователя';
COMMENT ON COLUMN public.referrals.invitee_user_id IS 'FK на приглашённого пользователя';
COMMENT ON COLUMN public.referrals.status IS 'Статус: registered, activated, bonus_paid';
COMMENT ON COLUMN public.referrals.inviter_bonus IS 'Начисленный бонус пригласившему';
COMMENT ON COLUMN public.referrals.invitee_bonus IS 'Начисленный бонус приглашённому';

-- =====================================================
-- CALLBACK_REQUESTS - Заявки на звонок
-- =====================================================

COMMENT ON TABLE public.callback_requests IS 'Заявки на обратный звонок';
COMMENT ON COLUMN public.callback_requests.id IS 'Уникальный идентификатор заявки';
COMMENT ON COLUMN public.callback_requests.name IS 'Имя клиента';
COMMENT ON COLUMN public.callback_requests.phone IS 'Телефон клиента';
COMMENT ON COLUMN public.callback_requests.status IS 'Статус: new, processing, completed, cancelled';
COMMENT ON COLUMN public.callback_requests.source IS 'Источник: website, mobile, telegram';
COMMENT ON COLUMN public.callback_requests.processed_by IS 'FK на обработавшего сотрудника';
COMMENT ON COLUMN public.callback_requests.processed_at IS 'Время обработки';
COMMENT ON COLUMN public.callback_requests.notes IS 'Заметки оператора';

-- =====================================================
-- NOTIFICATION_SETTINGS - Настройки уведомлений
-- =====================================================

COMMENT ON TABLE public.notification_settings IS 'Настройки уведомлений пользователей';
COMMENT ON COLUMN public.notification_settings.id IS 'Уникальный идентификатор';
COMMENT ON COLUMN public.notification_settings.user_id IS 'FK на пользователя';
COMMENT ON COLUMN public.notification_settings.email_enabled IS 'Уведомления на email';
COMMENT ON COLUMN public.notification_settings.sms_enabled IS 'SMS уведомления';
COMMENT ON COLUMN public.notification_settings.push_enabled IS 'Push уведомления';
COMMENT ON COLUMN public.notification_settings.telegram_enabled IS 'Уведомления в Telegram';

-- =====================================================
-- SERVICE_CATEGORIES - Категории услуг
-- =====================================================

-- Уже есть комментарии в 020_service_categories.sql

-- =====================================================
-- CHATS - Чаты с поддержкой
-- =====================================================

-- Уже есть комментарии в 014_chat_system.sql

-- =====================================================
-- CHAT_MESSAGES - Сообщения чата
-- =====================================================

-- Уже есть комментарии в 014_chat_system.sql

-- =====================================================
-- ACHIEVEMENTS - Достижения
-- =====================================================

-- Уже есть комментарии в 007_achievements.sql

-- =====================================================
-- CONNECTION_REQUESTS - Заявки на подключение
-- =====================================================

-- Уже есть комментарии в 005_add_connection_requests.sql и 006_update_connection_requests.sql

-- =====================================================
-- PARTNERS - Партнёры
-- =====================================================

-- Уже есть комментарии в 018_partners.sql

-- =====================================================
-- PARTNER_COVERAGE_ZONES - Зоны покрытия партнёров
-- =====================================================

-- Уже есть комментарии в 019_partner_coverage_zones.sql

-- =====================================================
-- COVERAGE_ZONES - Общие зоны покрытия
-- =====================================================

-- Уже есть комментарии в 023_coverage_zones.sql

-- =====================================================
-- TICKETS - Тикеты поддержки
-- =====================================================

-- Уже есть комментарии в 022_tickets.sql

-- =====================================================
-- COMMUNITY_* - Общий чат
-- =====================================================

-- Уже есть комментарии в 025_community_chat.sql и 026_community_improvements.sql

-- =====================================================
-- ADMINS - Администраторы
-- =====================================================

-- Уже есть комментарии в 017_admins.sql
