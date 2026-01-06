<script setup lang="ts">
definePageMeta({
  layout: 'lk',
  middleware: 'auth'
})

const contacts = [
  {
    id: 1,
    title: 'Телефон',
    value: '+7 (495) 123-45-67',
    description: 'Ежедневно с 9:00 до 21:00',
    icon: 'heroicons:phone',
    action: 'tel:+74951234567'
  },
  {
    id: 2,
    title: 'Telegram',
    value: '@pg19_support',
    description: 'Быстрые ответы в чате',
    icon: 'simple-icons:telegram',
    action: 'https://t.me/pg19_support'
  },
  {
    id: 3,
    title: 'Email',
    value: 'support@pg19.ru',
    description: 'Ответ в течение 24 часов',
    icon: 'heroicons:envelope',
    action: 'mailto:support@pg19.ru'
  }
]

const faq = [
  {
    id: 1,
    question: 'Как пополнить баланс?',
    answer: 'Пополнить баланс можно банковской картой в личном кабинете, через Сбербанк Онлайн по номеру договора, или наличными в офисе.'
  },
  {
    id: 2,
    question: 'Что делать, если интернет не работает?',
    answer: 'Проверьте баланс в личном кабинете. Перезагрузите роутер. Если проблема не решена - свяжитесь с поддержкой.'
  },
  {
    id: 3,
    question: 'Как сменить тариф?',
    answer: 'Смена тарифа доступна в разделе "Услуги". Новый тариф активируется с 1 числа следующего месяца.'
  },
  {
    id: 4,
    question: 'Как получить счет на оплату?',
    answer: 'Все счета доступны в разделе "Счета". Вы можете скачать PDF для оплаты через банк.'
  }
]

const expandedFaq = ref<number | null>(null)

const toggleFaq = (id: number) => {
  expandedFaq.value = expandedFaq.value === id ? null : id
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Поддержка</h1>
      <p class="text-gray-400 mt-1">Свяжитесь с нами любым удобным способом</p>
    </div>

    <!-- Contact Methods -->
    <section>
      <h2 class="text-lg font-semibold text-white mb-4">Контакты</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <a
          v-for="contact in contacts"
          :key="contact.id"
          :href="contact.action"
          target="_blank"
          class="block"
        >
          <UCard class="p-5 h-full hover:border-primary/30 transition-colors">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Icon :name="contact.icon" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <p class="text-sm text-gray-400">{{ contact.title }}</p>
                <p class="font-semibold text-white mt-0.5">{{ contact.value }}</p>
                <p class="text-sm text-gray-500 mt-1">{{ contact.description }}</p>
              </div>
            </div>
          </UCard>
        </a>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2 class="text-lg font-semibold text-white mb-4">Частые вопросы</h2>
      <div class="space-y-3">
        <UCard
          v-for="item in faq"
          :key="item.id"
          class="p-0 overflow-hidden cursor-pointer"
          @click="toggleFaq(item.id)"
        >
          <div class="p-5">
            <div class="flex items-center justify-between gap-4">
              <h3 class="font-medium text-white">{{ item.question }}</h3>
              <Icon
                name="heroicons:chevron-down"
                class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
                :class="{ 'rotate-180': expandedFaq === item.id }"
              />
            </div>
            <div
              v-show="expandedFaq === item.id"
              class="mt-3 pt-3 border-t border-white/5"
            >
              <p class="text-gray-400">{{ item.answer }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <!-- Support Request -->
    <section>
      <UCard class="p-6">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="heroicons:chat-bubble-left-right" class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Не нашли ответ?</h3>
          <p class="text-gray-400 mb-4">Напишите нам, и мы ответим в течение 15 минут</p>
          <UButton>
            <Icon name="heroicons:pencil-square" class="w-5 h-5 mr-2" />
            Написать обращение
          </UButton>
        </div>
      </UCard>
    </section>
  </div>
</template>
