// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode'
  ],

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
