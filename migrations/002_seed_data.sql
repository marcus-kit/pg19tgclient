-- Seed data for PG19 local development
-- Services and 5 test accounts

-- =====================================================
-- SERVICES (Тарифы)
-- =====================================================

INSERT INTO public.services (name, price_monthly, price_connection, description, sort_order, is_active) VALUES
-- Интернет тарифы
('Интернет 100 Мбит/с', 35000, 0, 'Безлимитный интернет до 100 Мбит/с', 10, true),
('Интернет 300 Мбит/с', 50000, 0, 'Безлимитный интернет до 300 Мбит/с', 20, true),
('Интернет 500 Мбит/с', 70000, 0, 'Безлимитный интернет до 500 Мбит/с', 30, true),
('Интернет 1000 Мбит/с', 100000, 0, 'Безлимитный интернет до 1 Гбит/с', 40, true),

-- ТВ
('ТВ Базовый', 20000, 0, '120 каналов в HD качестве', 50, true),
('ТВ Расширенный', 35000, 0, '191 канал + кинозалы', 60, true),

-- Дополнительные услуги
('Статический IP', 10000, 0, 'Выделенный статический IP-адрес', 70, true),
('Видеонаблюдение', 30000, 50000, 'Подключение к системе видеонаблюдения', 80, true),
('Домофон', 15000, 20000, 'IP-домофония с приложением', 90, true),
('Мобильная связь', 50000, 0, 'Безлимит + 30ГБ интернета', 100, true);

-- =====================================================
-- TEST USERS (5 тестовых пользователей)
-- =====================================================

INSERT INTO public.users (first_name, last_name, middle_name, full_name, email, phone, telegram_username, status) VALUES
('Иван', 'Петров', 'Сергеевич', 'Петров Иван Сергеевич', 'ivan@test.local', '+79001234501', 'ivan_petrov', 'active'),
('Мария', 'Сидорова', 'Александровна', 'Сидорова Мария Александровна', 'maria@test.local', '+79001234502', 'maria_sid', 'active'),
('Алексей', 'Козлов', 'Николаевич', 'Козлов Алексей Николаевич', 'alexey@test.local', '+79001234503', NULL, 'active'),
('Елена', 'Новикова', 'Дмитриевна', 'Новикова Елена Дмитриевна', 'elena@test.local', '+79001234504', 'elena_nov', 'active'),
('Дмитрий', 'Морозов', 'Владимирович', 'Морозов Дмитрий Владимирович', 'dmitry@test.local', '+79001234505', 'dmitry_m', 'suspended');

-- =====================================================
-- TEST ACCOUNTS (5 тестовых договоров)
-- =====================================================

INSERT INTO public.accounts (user_id, contract_number, status, contract_status, balance, address_city, address_street, address_building, address_apartment, address_full, start_date) VALUES
(1, 1001, 'active', 'active', 150000, 'Москва', 'Ленина', '19', '1', 'г. Москва, ул. Ленина, д. 19, кв. 1', '2024-01-15'),
(2, 1002, 'active', 'active', 50000, 'Москва', 'Ленина', '19', '25', 'г. Москва, ул. Ленина, д. 19, кв. 25', '2024-02-01'),
(3, 1003, 'active', 'active', -20000, 'Москва', 'Ленина', '19', '48', 'г. Москва, ул. Ленина, д. 19, кв. 48', '2024-03-10'),
(4, 1004, 'blocked', 'active', -100000, 'Москва', 'Ленина', '19', '72', 'г. Москва, ул. Ленина, д. 19, кв. 72', '2024-04-20'),
(5, 1005, 'active', 'stopped', 0, 'Москва', 'Ленина', '19', '99', 'г. Москва, ул. Ленина, д. 19, кв. 99', '2024-05-05');

-- =====================================================
-- SUBSCRIPTIONS (Подписки на услуги)
-- =====================================================

-- Иван Петров - Интернет 500 + ТВ Расширенный + Статический IP
INSERT INTO public.subscriptions (account_id, service_id, status, is_primary) VALUES
(1, 3, 'active', true),   -- Интернет 500
(1, 6, 'active', false),  -- ТВ Расширенный
(1, 7, 'active', false);  -- Статический IP

-- Мария Сидорова - Интернет 300 + ТВ Базовый
INSERT INTO public.subscriptions (account_id, service_id, status, is_primary) VALUES
(2, 2, 'active', true),   -- Интернет 300
(2, 5, 'active', false);  -- ТВ Базовый

-- Алексей Козлов - Интернет 1000
INSERT INTO public.subscriptions (account_id, service_id, status, is_primary) VALUES
(3, 4, 'active', true);   -- Интернет 1000

-- Елена Новикова - Интернет 100 + Домофон (заблокирован)
INSERT INTO public.subscriptions (account_id, service_id, status, is_primary) VALUES
(4, 1, 'paused', true),   -- Интернет 100 (приостановлен)
(4, 9, 'paused', false);  -- Домофон (приостановлен)

-- Дмитрий Морозов - Интернет 300 (отменён)
INSERT INTO public.subscriptions (account_id, service_id, status, is_primary) VALUES
(5, 2, 'cancelled', true);

-- =====================================================
-- SAMPLE NEWS
-- =====================================================

INSERT INTO public.news (title, summary, content, category, status, published_at, is_pinned) OVERRIDING SYSTEM VALUE VALUES
(1, 'Добро пожаловать в ПЖ19!', 'Информация для новых участников сообщества', 'Приветствуем вас в сообществе ПЖ19! Здесь вы найдёте всю необходимую информацию о наших услугах и правилах. Не забудьте настроить уведомления в личном кабинете.', 'announcement', 'published', now(), true),
(2, 'Плановые работы 15 января', 'Информация о плановом обслуживании сети', 'Уважаемые участники! 15 января с 02:00 до 06:00 будут проводиться плановые работы по модернизации сетевого оборудования. Возможны кратковременные перебои в работе интернета.', 'notification', 'published', now() - interval '7 days', false);

-- Reset sequence for news
SELECT setval('news_id_seq', (SELECT MAX(id) FROM news));

-- =====================================================
-- NOTIFICATION SETTINGS for test users
-- =====================================================

INSERT INTO public.notification_settings (user_id, channel_email, channel_telegram, notify_balance_low, notify_payment_received) VALUES
(1, true, true, true, true),
(2, true, false, true, true),
(3, false, false, true, false),
(4, true, true, true, true),
(5, true, false, false, false);
