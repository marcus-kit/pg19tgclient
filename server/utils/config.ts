/**
 * Валидация runtime конфигурации
 * Проверяет наличие всех необходимых environment переменных при старте сервера
 */
export function validateConfig() {
  const config = useRuntimeConfig()
  const errors: string[] = []

  // Public variables (доступны на клиенте)
  if (!config.public.supabaseUrl) {
    errors.push('SUPABASE_URL is not set')
  }
  if (!config.public.supabaseKey) {
    errors.push('SUPABASE_KEY is not set')
  }
  if (!config.public.telegramBotUsername) {
    errors.push('TELEGRAM_BOT_USERNAME is not set')
  }

  // Server-only variables (приватные)
  if (!config.supabaseServiceKey) {
    errors.push('NUXT_SUPABASE_SERVICE_KEY is not set')
  }
  if (!config.telegramBotToken) {
    errors.push('NUXT_TELEGRAM_BOT_TOKEN is not set')
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:')
    errors.forEach(err => console.error(`  - ${err}`))
    throw new Error('Missing required environment variables. Check .env.example for reference.')
  }

  console.log('✅ Configuration validated successfully')
}
