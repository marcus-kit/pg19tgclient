-- Migration: 012_site_content.sql
-- Управляемый контент страниц сайта

CREATE TABLE IF NOT EXISTS public.site_content (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Идентификация
  page text NOT NULL,      -- 'home', 'about', 'internet', 'tv', etc.
  section text NOT NULL,   -- 'hero', 'features', 'stats', 'pricing', etc.

  -- Контент
  content jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Версионирование
  version integer NOT NULL DEFAULT 1,

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Уникальность page + section
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_page_section
  ON public.site_content(page, section);

-- Seed data из компонентов
INSERT INTO public.site_content (page, section, content) VALUES
  -- Home page
  ('home', 'hero_stats', '{
    "stats": [
      {"value": "191", "unit": "канал", "label": "ТВ", "color": "secondary"},
      {"value": "699", "unit": "₽/мес", "label": "от", "color": "accent"}
    ],
    "badge": "Более 100 000 участников сообщества"
  }'::jsonb),

  ('home', 'services', '{
    "title": "Всё для комфортной цифровой жизни",
    "subtitle": "Интернет, телевидение, мобильная связь и другие сервисы — всё в одном сообществе на выгодных условиях",
    "items": [
      {
        "id": "internet",
        "title": "Интернет",
        "description": "Мы не режем скорость. Канал до 1000 Мбит/с — вся полоса ваша",
        "features": ["Скорость не ограничена", "До 1000 Мбит/с", "10+ устройств"],
        "icon": "heroicons:wifi",
        "color": "primary",
        "link": "/internet"
      },
      {
        "id": "tv",
        "title": "Телевидение",
        "description": "191 канал в HD и 4K качестве. Архив передач до 14 дней",
        "features": ["191 канал", "HD и 4K", "Архив 14 дней"],
        "icon": "heroicons:tv",
        "color": "secondary",
        "link": "/tv"
      },
      {
        "id": "mobile",
        "title": "Мобильная связь",
        "description": "Выгодные тарифы для участников сообщества. Скоро!",
        "features": ["Выгодные тарифы", "Безлимит", "Скоро"],
        "icon": "heroicons:device-phone-mobile",
        "color": "accent",
        "link": "/mobile",
        "comingSoon": true
      },
      {
        "id": "cctv",
        "title": "Видеонаблюдение",
        "description": "Облачное хранение записей. Доступ с любого устройства",
        "features": ["Облачное хранение", "Доступ 24/7", "HD камеры"],
        "icon": "heroicons:video-camera",
        "color": "primary",
        "link": "/cctv"
      },
      {
        "id": "intercom",
        "title": "Домофон",
        "description": "Умный домофон с видеосвязью и управлением со смартфона",
        "features": ["Видеосвязь", "Управление с телефона", "Запись посетителей"],
        "icon": "heroicons:phone",
        "color": "secondary",
        "link": "/intercom"
      }
    ]
  }'::jsonb),

  ('home', 'pricing', '{
    "min_price": 699,
    "included": [
      {"text": "Интернет без ограничения скорости", "icon": "heroicons:wifi"},
      {"text": "Цифровое ТВ 191 канал", "icon": "heroicons:tv"},
      {"text": "Техподдержка 24/7", "icon": "heroicons:phone"},
      {"text": "Право голоса", "icon": "heroicons:hand-raised"}
    ]
  }'::jsonb),

  -- Internet page
  ('internet', 'features', '{
    "items": [
      {"icon": "heroicons:no-symbol", "title": "Мы не режем скорость", "description": "Вы получаете всю полосу канала. Никаких искусственных ограничений"},
      {"icon": "heroicons:bolt", "title": "До 1000 Мбит/с", "description": "Максимальная скорость зависит только от вашего оборудования"},
      {"icon": "heroicons:device-tablet", "title": "10+ устройств", "description": "Стабильная работа всех гаджетов одновременно"},
      {"icon": "heroicons:arrow-down-tray", "title": "1 ГБ за 20 сек", "description": "Скачивание файлов на максимальной скорости"}
    ],
    "equipment": {
      "title": "Оборудование",
      "router": {
        "name": "Wi-Fi роутер",
        "description": "Двухдиапазонный роутер для стабильного покрытия",
        "price_monthly": 99
      }
    }
  }'::jsonb),

  -- TV page
  ('tv', 'features', '{
    "total_channels": 191,
    "equipment": {
      "title": "Оборудование",
      "box": {
        "name": "ТВ-приставка",
        "description": "Современная приставка с поддержкой 4K",
        "price_monthly": 99
      }
    }
  }'::jsonb),

  -- Contacts (общие)
  ('global', 'contacts', '{
    "phone": "+7 (863) 123-45-67",
    "phone_free": "8 (800) 123-45-67",
    "email": "info@pg19.ru",
    "email_business": "business@pg19.ru",
    "email_partners": "partners@pg19.ru",
    "telegram": "@pg19support",
    "address": "г. Ростов-на-Дону",
    "working_hours": "Пн-Пт: 9:00-18:00"
  }'::jsonb),

  -- About page
  ('about', 'stats', '{
    "members": "100 000+",
    "channels": 191,
    "min_price": 699,
    "support": "24/7"
  }'::jsonb)

ON CONFLICT (page, section) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

-- RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site content viewable by everyone" ON public.site_content;
CREATE POLICY "Site content viewable by everyone"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to site_content" ON public.site_content;
CREATE POLICY "Service role full access to site_content"
  ON public.site_content FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE public.site_content IS 'Управляемый контент страниц сайта';
COMMENT ON COLUMN public.site_content.page IS 'Страница: home, about, internet, tv, global';
COMMENT ON COLUMN public.site_content.section IS 'Секция: hero, features, stats, contacts';
