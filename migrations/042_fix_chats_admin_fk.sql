-- 042_fix_chats_admin_fk.sql
-- Добавление FK для assigned_admin_id в chats для корректной работы Supabase PostgREST

-- ========================================
-- 1. Добавить FK constraint
-- ========================================

-- Сначала удалим если существует (для идемпотентности)
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_assigned_admin_id_fkey;

-- Добавляем FK с ON DELETE SET NULL (при удалении админа - сбрасываем назначение)
ALTER TABLE public.chats
ADD CONSTRAINT chats_assigned_admin_id_fkey
FOREIGN KEY (assigned_admin_id)
REFERENCES public.admins(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.chats.assigned_admin_id IS 'FK на администратора, назначенного на чат';

-- ========================================
-- 2. Создать индекс для производительности
-- ========================================

CREATE INDEX IF NOT EXISTS idx_chats_assigned_admin_id
ON public.chats(assigned_admin_id)
WHERE assigned_admin_id IS NOT NULL;
