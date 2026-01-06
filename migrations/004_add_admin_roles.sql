-- Миграция 004: Добавление ролей пользователей для админ-панели
-- Дата: 2026-01-06

-- Создание типа для ролей (с проверкой существования)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'moderator');
    END IF;
END
$$;

-- Добавление колонки role в таблицу users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role public.user_role DEFAULT 'user';
    END IF;
END
$$;

-- Установить admin для первого пользователя (для разработки)
UPDATE public.users SET role = 'admin' WHERE id = 1 AND role IS NULL;

-- Индекс для быстрого поиска по ролям
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Комментарии
COMMENT ON COLUMN public.users.role IS 'Роль пользователя: user (обычный), admin (администратор), moderator (модератор)';
