// GET /api/faq
// Возвращает FAQ из страницы 'faq' или дефолтные данные

export interface FaqItem {
  id: number
  question: string
  answer: string
  category?: string
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Получаем страницу FAQ
  const { data: page } = await supabase
    .from('pages')
    .select('content')
    .eq('slug', 'faq')
    .eq('is_published', true)
    .single()

  // Если есть страница с FAQ в формате JSON, парсим её
  if (page?.content) {
    try {
      // Пробуем распарсить как JSON массив FAQ
      const parsed = JSON.parse(page.content)
      if (Array.isArray(parsed)) {
        return { faq: parsed as FaqItem[] }
      }
    } catch {
      // Если не JSON, возвращаем пустой массив
    }
  }

  // Дефолтные FAQ (если нет в базе)
  const defaultFaq: FaqItem[] = [
    {
      id: 1,
      question: 'Как пополнить баланс?',
      answer: 'Вы можете пополнить баланс через личный кабинет банковской картой, через СБП или в любом отделении банка по реквизитам из счёта.',
      category: 'billing'
    },
    {
      id: 2,
      question: 'Что делать, если не работает интернет?',
      answer: 'Проверьте подключение кабеля и перезагрузите роутер. Если проблема сохраняется, создайте обращение в техподдержку.',
      category: 'technical'
    },
    {
      id: 3,
      question: 'Как изменить тариф?',
      answer: 'Перейдите в раздел "Услуги" и выберите новый тариф. Изменение вступит в силу со следующего расчётного периода.',
      category: 'tariff'
    },
    {
      id: 4,
      question: 'Где найти счета за услуги?',
      answer: 'Все счета доступны в разделе "Счета" личного кабинета. Вы можете скачать счёт в PDF формате.',
      category: 'billing'
    },
    {
      id: 5,
      question: 'Как подключить дополнительные услуги?',
      answer: 'В разделе "Услуги" представлен список доступных опций. Выберите нужную услугу и нажмите "Подключить".',
      category: 'services'
    }
  ]

  return { faq: defaultFaq }
})
