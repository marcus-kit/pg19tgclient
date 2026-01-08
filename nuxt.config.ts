// https://nuxt.com/docs/api/configuration/nuxt-config
const yandexMapsApiKey = process.env.YANDEX_MAPS_API_KEY || '7a3c61c9-9e01-48b8-ad12-9a5688cc3a1b'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: [
    'vue-yandex-maps/css',
    '~/assets/css/main.css'
  ],

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    'vue-yandex-maps/nuxt'
  ],

  yandexMaps: {
    apikey: yandexMapsApiKey,
    initializeOn: 'onComponentMount'
  },

  supabase: {
    // Отключаем встроенный redirect - используем свой middleware
    redirect: false
  },

  runtimeConfig: {
    // Server-only (не попадают в клиентский бандл)
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    dadataApiKey: process.env.DADATA_API_KEY || '3a890b6a24260676c60bd8176c9ee713bb383880',
    dadataSecretKey: process.env.DADATA_SECRET_KEY || 'a68745fdec19fdbed5376b5023226ea59c1a68c1',
    // Public (доступны и на клиенте)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || '',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'PG19CONNECTBOT',
      yandexMapsApiKey
    }
  },

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },

  googleFonts: {
    families: {
      Outfit: [400, 500, 600, 700, 800]
    },
    display: 'swap',
    preload: true
  },

  app: {
    head: {
      title: 'ПЖ19 — сообщество, а не провайдер',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ПЖ19 — закрытое сообщество для совместного доступа к услугам связи. Интернет до 1000 Мбит/с, ТВ 191 канал.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
