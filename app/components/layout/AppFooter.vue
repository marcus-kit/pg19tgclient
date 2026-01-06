<script setup lang="ts">
const services = [
  { name: 'Интернет', href: '/internet' },
  { name: 'Телевидение', href: '/tv' },
  { name: 'Мобильная связь', href: '/mobile' },
  { name: 'Видеонаблюдение', href: '/cctv' },
  { name: 'Умный домофон', href: '/intercom' }
]

const company = [
  { name: 'О сообществе', href: '/about' },
  { name: 'Партнёрам', href: '/partners' },
  { name: 'Бизнесу', href: '/business' },
  { name: 'Новости', href: '/news' }
]

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-[#0a0f1a] text-gray-400 relative overflow-hidden">
    <!-- Subtle mesh gradient -->
    <div class="absolute inset-0 opacity-30">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="container mx-auto px-4 py-16 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
        <!-- Logo & Description -->
        <div class="lg:col-span-4">
          <NuxtLink to="/" class="inline-block mb-6 group">
            <img
              src="/logo.png"
              alt="ПЖ19"
              class="h-12 transition-transform group-hover:scale-105"
            />
          </NuxtLink>
          <p class="text-gray-500 mb-6 leading-relaxed">
            Закрытое сообщество для совместного доступа к услугам связи на некоммерческой основе.
            Мы не провайдер — мы вместе строим инфраструктуру.
          </p>

          <!-- Social Links -->
          <div class="flex items-center gap-3">
            <a
              href="#"
              class="group w-11 h-11 rounded-xl glass-card flex items-center justify-center hover:bg-primary/20 transition-all"
            >
              <Icon name="simple-icons:telegram" class="w-5 h-5 group-hover:text-primary transition-colors" />
            </a>
            <a
              href="#"
              class="group w-11 h-11 rounded-xl glass-card flex items-center justify-center hover:bg-primary/20 transition-all"
            >
              <Icon name="simple-icons:vk" class="w-5 h-5 group-hover:text-primary transition-colors" />
            </a>
            <a
              href="#"
              class="group w-11 h-11 rounded-xl glass-card flex items-center justify-center hover:bg-primary/20 transition-all"
            >
              <Icon name="simple-icons:youtube" class="w-5 h-5 group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>

        <!-- Services -->
        <div class="lg:col-span-2">
          <h3 class="text-white font-semibold mb-5 text-lg">Услуги</h3>
          <ul class="space-y-3">
            <li v-for="item in services" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="text-gray-500 hover:text-primary transition-colors relative link-hover inline-block"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Company -->
        <div class="lg:col-span-2">
          <h3 class="text-white font-semibold mb-5 text-lg">Сообщество</h3>
          <ul class="space-y-3">
            <li v-for="item in company" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="text-gray-500 hover:text-primary transition-colors relative link-hover inline-block"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contacts -->
        <div class="lg:col-span-4">
          <h3 class="text-white font-semibold mb-5 text-lg">Контакты</h3>
          <ul class="space-y-4">
            <li>
              <a
                href="tel:+78001234567"
                class="flex items-center gap-3 group"
              >
                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="heroicons:phone" class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p class="text-white font-medium group-hover:text-primary transition-colors">8 (800) 123-45-67</p>
                  <p class="text-xs text-gray-600">Бесплатно по России</p>
                </div>
              </a>
            </li>
            <li>
              <a
                href="mailto:info@pg19.ru"
                class="flex items-center gap-3 group"
              >
                <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Icon name="heroicons:envelope" class="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p class="text-white font-medium group-hover:text-secondary transition-colors">info@pg19.ru</p>
                  <p class="text-xs text-gray-600">Напишите нам</p>
                </div>
              </a>
            </li>
            <li class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon name="heroicons:clock" class="w-5 h-5 text-accent" />
              </div>
              <div>
                <p class="text-white font-medium">Пн-Пт: 9:00 - 18:00</p>
                <p class="text-xs text-gray-600">Рабочее время</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <div class="border-t border-white/5">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-600">
            © {{ currentYear }} ПЖ19. Потребительский кооператив.
          </p>
          <p class="text-xs text-gray-700 flex items-center gap-2">
            <Icon name="heroicons:shield-check" class="w-4 h-4" />
            Деятельность ведётся в соответствии с законодательством РФ о потребительской кооперации.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>
