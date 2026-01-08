-- Migration: 043_remove_users_auth_user_id
-- Description: Remove unused auth_user_id column from users table
-- Date: 2025-01-08

-- Столбец auth_user_id не используется в коде:
-- - Авторизация клиентов работает через telegram_id
-- - RLS политики не проверяют auth.uid() = auth_user_id
-- - Нет планов на email/password авторизацию для клиентов

ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;
