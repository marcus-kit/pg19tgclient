// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],
  ssr: false,
  devtools: { enabled: true },

  app: {
    // Быстрые переходы между страницами
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },

    head: {
      title: 'ПЖ19 — Личный кабинет',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Личный кабинет ПЖ19 в Telegram' },
      ],
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  // Настройки роутера
  router: {
    options: {
      hashMode: false,
      scrollBehaviorType: 'smooth',
    },
  },

  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || '',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
      twaUrl: process.env.TWA_URL || 'https://pg19v3-tg.doka.team',
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  // Экспериментальные фичи для скорости
  experimental: {
    viewTransition: true, // Плавные переходы между страницами
    payloadExtraction: false, // Не нужно для SPA
  },
  compatibilityDate: '2025-01-26',

  eslint: {
    config: {
      stylistic: true,
    },
  },

  supabase: {
    redirect: false,
  },
})
