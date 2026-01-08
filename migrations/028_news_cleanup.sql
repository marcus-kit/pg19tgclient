-- Migration: 028_news_cleanup.sql
-- Description: Очистка News системы - удаление news_read_status, добавление Storage bucket
-- Created: 2026-01-08

-- =====================================================
-- 1. Удаление таблицы news_read_status
-- Причина: таблица не используется в production коде
-- =====================================================

-- Удаляем RLS политики
DROP POLICY IF EXISTS "Service role has full access to news_read_status" ON public.news_read_status;
DROP POLICY IF EXISTS "Users can view own read status" ON public.news_read_status;
DROP POLICY IF EXISTS "Users can mark news as read" ON public.news_read_status;

-- Удаляем индексы
DROP INDEX IF EXISTS idx_news_read_status_user_id;
DROP INDEX IF EXISTS idx_news_read_status_news_id;

-- Удаляем constraint уникальности
ALTER TABLE public.news_read_status DROP CONSTRAINT IF EXISTS news_read_status_news_id_user_id_key;

-- Удаляем FK constraints
ALTER TABLE public.news_read_status DROP CONSTRAINT IF EXISTS news_read_status_news_id_fkey;
ALTER TABLE public.news_read_status DROP CONSTRAINT IF EXISTS news_read_status_user_id_fkey;

-- Удаляем таблицу
DROP TABLE IF EXISTS public.news_read_status;

-- =====================================================
-- 2. Создание Storage bucket для вложений новостей
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-attachments',
  'news-attachments',
  true,  -- публичный доступ для чтения
  10485760,  -- 10 MB максимальный размер файла
  ARRAY[
    -- Изображения
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Документы
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Архивы
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Storage политики для news-attachments
-- =====================================================

-- Публичное чтение вложений
DROP POLICY IF EXISTS "Public can read news attachments" ON storage.objects;
CREATE POLICY "Public can read news attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news-attachments');

-- Service role может управлять всеми вложениями
DROP POLICY IF EXISTS "Service role can manage news attachments" ON storage.objects;
CREATE POLICY "Service role can manage news attachments"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'news-attachments')
WITH CHECK (bucket_id = 'news-attachments');

-- Authenticated users могут загружать (для админки)
DROP POLICY IF EXISTS "Authenticated can upload news attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload news attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-attachments');

-- =====================================================
-- 4. Обновление структуры news_attachments
-- =====================================================

-- Добавляем колонку для Storage path
ALTER TABLE public.news_attachments
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Индекс для быстрого поиска по storage_path
CREATE INDEX IF NOT EXISTS idx_news_attachments_storage_path
  ON public.news_attachments(storage_path)
  WHERE storage_path IS NOT NULL;

-- =====================================================
-- 5. Комментарии
-- =====================================================

COMMENT ON COLUMN public.news_attachments.storage_path IS 'Путь к файлу в Supabase Storage (bucket: news-attachments)';
COMMENT ON COLUMN public.news_attachments.file_path IS 'DEPRECATED: Используйте storage_path для новых вложений';


-- =====================================================
-- ROLLBACK SCRIPT (сохранить отдельно)
-- =====================================================
/*
-- Восстановление news_read_status
CREATE TABLE IF NOT EXISTS public.news_read_status (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  news_id bigint NOT NULL,
  user_id bigint NOT NULL,
  read_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.news_read_status
  ADD CONSTRAINT news_read_status_news_id_user_id_key UNIQUE (news_id, user_id);
ALTER TABLE public.news_read_status
  ADD CONSTRAINT news_read_status_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id);
ALTER TABLE public.news_read_status
  ADD CONSTRAINT news_read_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.news_read_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access to news_read_status"
  ON public.news_read_status FOR ALL TO service_role USING (true);

-- Удаление Storage bucket (ВНИМАНИЕ: файлы будут удалены!)
DELETE FROM storage.objects WHERE bucket_id = 'news-attachments';
DELETE FROM storage.buckets WHERE id = 'news-attachments';

-- Удаление колонки storage_path
ALTER TABLE public.news_attachments DROP COLUMN IF EXISTS storage_path;
*/
