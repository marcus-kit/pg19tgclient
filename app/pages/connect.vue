<script setup lang="ts">
useHead({
  title: 'Подключиться — ПЖ19'
})

const form = reactive({
  name: '',
  phone: '',
  address: '',
  email: '',
  comment: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)

const submitForm = async () => {
  isSubmitting.value = true
  // TODO: Connect to Supabase
  await new Promise(resolve => setTimeout(resolve, 1000))
  isSubmitting.value = false
  isSubmitted.value = true
}
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[500px] h-[500px] bg-primary/15 -bottom-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in-up">
            Подключиться к <span class="text-gradient-primary">сообществу</span>
          </h1>
          <p class="text-xl text-gray-400 opacity-0 animate-fade-in-up stagger-1">
            Оставьте заявку, и мы свяжемся с вами для уточнения деталей
          </p>
        </div>
      </div>
    </section>

    <!-- Form -->
    <section class="py-20 md:py-32 bg-gray-900">
      <div class="container mx-auto px-4">
        <div class="max-w-xl mx-auto">
          <!-- Success message -->
          <div v-if="isSubmitted" class="text-center opacity-0 animate-fade-in-up">
            <div class="w-20 h-20 glass-card rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Icon name="heroicons:check" class="w-10 h-10 text-accent" />
            </div>
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Заявка отправлена!</h2>
            <p class="text-gray-400 mb-10">
              Мы свяжемся с вами в ближайшее время для уточнения деталей подключения.
            </p>
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-medium transition-colors"
            >
              <Icon name="heroicons:arrow-left" class="w-4 h-4" />
              <span>Вернуться на главную</span>
            </NuxtLink>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="submitForm" class="space-y-6">
            <!-- Name -->
            <div class="opacity-0 animate-fade-in-up">
              <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                ФИО <span class="text-primary">*</span>
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                placeholder="Иванов Иван Иванович"
                class="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              />
            </div>

            <!-- Phone -->
            <div class="opacity-0 animate-fade-in-up stagger-1">
              <label for="phone" class="block text-sm font-medium text-gray-300 mb-2">
                Телефон <span class="text-primary">*</span>
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                placeholder="+7 (999) 123-45-67"
                class="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              />
            </div>

            <!-- Address -->
            <div class="opacity-0 animate-fade-in-up stagger-2">
              <label for="address" class="block text-sm font-medium text-gray-300 mb-2">
                Адрес подключения
              </label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                class="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              />
            </div>

            <!-- Email -->
            <div class="opacity-0 animate-fade-in-up stagger-3">
              <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="example@mail.ru"
                class="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              />
            </div>

            <!-- Comment -->
            <div class="opacity-0 animate-fade-in-up stagger-4">
              <label for="comment" class="block text-sm font-medium text-gray-300 mb-2">
                Комментарий
              </label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                placeholder="Дополнительная информация..."
                class="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors resize-none"
              ></textarea>
            </div>

            <!-- Submit -->
            <div class="opacity-0 animate-fade-in-up stagger-5">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg disabled:opacity-50"
              >
                <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                <span>{{ isSubmitting ? 'Отправка...' : 'Отправить заявку' }}</span>
              </button>
            </div>

            <!-- Legal -->
            <p class="text-xs text-gray-500 text-center opacity-0 animate-fade-in-up stagger-6">
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
            </p>
          </form>
        </div>
      </div>
    </section>

    <!-- Info -->
    <section class="py-20 md:py-32 mesh-gradient-dark">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-white text-center mb-12">Как это работает</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 class="font-semibold text-white mb-2">Заявка</h3>
              <p class="text-gray-400 text-sm">Оставьте заявку на сайте или позвоните нам</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 class="font-semibold text-white mb-2">Консультация</h3>
              <p class="text-gray-400 text-sm">Мы проверим возможность подключения и расскажем об условиях</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 class="font-semibold text-white mb-2">Подключение</h3>
              <p class="text-gray-400 text-sm">Наш специалист приедет и настроит оборудование</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
