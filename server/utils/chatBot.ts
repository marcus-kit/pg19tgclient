import { createClient } from '@supabase/supabase-js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

const SYSTEM_PROMPT = `Ты — виртуальный помощник сообщества "ПЖ19" (интернет-провайдер).

Твои возможности:
- Отвечать на вопросы о услугах (интернет, ТВ, мобильная связь, видеонаблюдение, домофон)
- Информировать о тарифах и ценах
- Помогать с общими вопросами о подключении
- Направлять к оператору при сложных вопросах

Ты НЕ можешь:
- Изменять данные аккаунта
- Решать технические проблемы с оборудованием
- Обрабатывать платежи
- Отменять или менять тарифы

Если вопрос требует участия человека, вежливо сообщи что переключаешь на оператора.

Отвечай кратко и по делу. Используй русский язык.`

interface ChatMessage {
  id: number
  sender_type: string
  content: string
  created_at: string
}

interface BotResponse {
  message: string
  escalate: boolean
}

interface BotContext {
  userName?: string
  userId?: number
  accountInfo?: string
}

// Получить историю сообщений чата
async function getChatHistory(chatId: number): Promise<ChatMessage[]> {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  const { data } = await supabase
    .from('chat_messages')
    .select('id, sender_type, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(20) // Последние 20 сообщений для контекста

  return data || []
}

// Проверить нужна ли эскалация
function shouldEscalate(message: string, response: string): boolean {
  const escalationPhrases = [
    'оператор',
    'человек',
    'переключ',
    'соединя',
    'не могу помочь',
    'технический специалист',
    'поддержк'
  ]

  const lowerResponse = response.toLowerCase()
  return escalationPhrases.some(phrase => lowerResponse.includes(phrase))
}

export async function processWithBot(
  chatId: number,
  userMessage: string,
  context: BotContext
): Promise<BotResponse | null> {
  try {
    // Получаем историю
    const history = await getChatHistory(chatId)

    // Формируем сообщения для Ollama
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    // Добавляем контекст пользователя
    if (context.userName) {
      messages.push({
        role: 'system',
        content: `Имя пользователя: ${context.userName}`
      })
    }

    // Добавляем историю
    for (const msg of history) {
      messages.push({
        role: msg.sender_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    }

    // Добавляем текущее сообщение
    messages.push({ role: 'user', content: userMessage })

    // Отправляем в Ollama
    const response = await $fetch<{
      message: { content: string }
    }>(OLLAMA_URL, {
      method: 'POST',
      body: {
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      },
      timeout: 30000
    })

    if (!response?.message?.content) {
      console.error('Empty response from Ollama')
      return null
    }

    const botMessage = response.message.content.trim()
    const escalate = shouldEscalate(userMessage, botMessage)

    return {
      message: botMessage,
      escalate
    }
  } catch (error) {
    console.error('Ollama error:', error)
    // При ошибке возвращаем сообщение об эскалации
    return {
      message: 'Извините, сейчас я не могу ответить. Переключаю вас на оператора.',
      escalate: true
    }
  }
}
