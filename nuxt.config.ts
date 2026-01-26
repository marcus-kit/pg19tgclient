// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-26',
  devtools: { enabled: true },
  ssr: false,

  future: {
    compatibilityVersion: 4
  },

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: false
  },

  eslint: {
    config: {
      stylistic: true
    }
  },

  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || '',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
      twaUrl: process.env.TWA_URL || 'https://pg19v3-tg.doka.team'
    }
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
