// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css'
  ],

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],

  supabase: {
    // Отключаем встроенный redirect - используем свой middleware
    redirect: false
  },

  runtimeConfig: {
    // Server-only (не попадают в клиентский бандл)
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    // Public (доступны и на клиенте)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || '',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'PG19WEBAPP_bot'
    }
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
      title: 'ПЖ19 — Личный кабинет',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Личный кабинет ПЖ19 в Telegram' }
      ],
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
