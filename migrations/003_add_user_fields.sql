-- Add missing fields to users table for profile editing
-- birth_date - дата рождения
-- avatar - base64 или URL аватара
-- vk_id - ID ВКонтакте

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vk_id text;

-- Update seed data with sample birth dates
UPDATE public.users SET birth_date = '1985-03-15' WHERE id = 1;
UPDATE public.users SET birth_date = '1990-07-22' WHERE id = 2;
UPDATE public.users SET birth_date = '1978-11-08' WHERE id = 3;
UPDATE public.users SET birth_date = '1995-01-30' WHERE id = 4;
UPDATE public.users SET birth_date = '1982-09-12' WHERE id = 5;
