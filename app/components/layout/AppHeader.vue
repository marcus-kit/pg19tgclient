<script setup lang="ts">
const colorMode = useColorMode()
const isMenuOpen = ref(false)
const isScrolled = ref(false)

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
  }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

const mainNav = [
  { name: 'Частным лицам', href: '/' },
  { name: 'Бизнесу', href: '/business' },
  { name: 'Партнёрам', href: '/partners' },
  { name: 'О сообществе', href: '/about' }
]

const servicesNav = [
  { name: 'Интернет', href: '/internet', icon: 'heroicons:wifi' },
  { name: 'Телевидение', href: '/tv', icon: 'heroicons:tv' },
  { name: 'Мобильная связь', href: '/mobile', icon: 'heroicons:device-phone-mobile' },
  { name: 'Видеонаблюдение', href: '/cctv', icon: 'heroicons:video-camera' },
  { name: 'Домофон', href: '/intercom', icon: 'heroicons:home' }
]
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="isScrolled ? 'header-blur shadow-lg' : 'header-transparent'"
  >
    <!-- Top Level: Main navigation -->
    <div class="border-b border-white/5">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-11 text-sm">
          <!-- Main nav (left) -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in mainNav"
              :key="item.href"
              :to="item.href"
              class="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
              active-class="text-primary bg-primary/10"
            >
              {{ item.name }}
            </NuxtLink>
          </nav>

          <!-- Right side icons -->
          <div class="hidden md:flex items-center gap-2">
            <NuxtLink
              to="/news"
              class="p-2 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
              title="Новости"
            >
              <Icon name="heroicons:newspaper" class="w-5 h-5" />
            </NuxtLink>
            <button
              class="p-2 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
              title="Чат поддержки"
            >
              <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5" />
            </button>
            <a
              href="tel:+78001234567"
              class="p-2 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
              title="Позвонить"
            >
              <Icon name="heroicons:phone" class="w-5 h-5" />
            </a>
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="theme-toggle"
              :title="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
            >
              <Icon
                :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'"
                class="w-5 h-5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Level: Logo + Services navigation -->
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex-shrink-0 group">
          <img
            src="/logo.png"
            alt="ПЖ19"
            class="h-10 transition-transform duration-300 group-hover:scale-105"
          />
        </NuxtLink>

        <!-- Services nav (center, desktop) -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink
            v-for="item in servicesNav"
            :key="item.href"
            :to="item.href"
            class="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 group"
            active-class="text-primary bg-primary/10"
          >
            <Icon
              :name="item.icon"
              class="w-5 h-5 transition-colors duration-300 group-hover:text-primary"
            />
            <span class="font-medium">{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <!-- CTA Button -->
        <NuxtLink
          to="/connect"
          class="hidden md:flex btn-primary items-center gap-2"
        >
          <span>Подключиться</span>
          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
        </NuxtLink>

        <!-- Mobile menu button -->
        <button
          @click="isMenuOpen = !isMenuOpen"
          class="lg:hidden p-2 text-[var(--text-secondary)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
        >
          <Icon :name="isMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'" class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="isMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-t"
        :style="{ background: 'var(--header-blur-bg)', borderColor: 'var(--header-border)' }"
      >
        <div class="container mx-auto px-4 py-6 space-y-6">
          <!-- Main nav mobile -->
          <nav class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="item in mainNav"
              :key="item.href"
              :to="item.href"
              @click="isMenuOpen = false"
              class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full border border-[var(--glass-border)] hover:border-primary/50 hover:bg-primary/10 transition-all"
            >
              {{ item.name }}
            </NuxtLink>
          </nav>

          <!-- Theme toggle mobile -->
          <div class="flex items-center justify-between px-4 py-3 glass-card rounded-xl">
            <span class="text-[var(--text-secondary)]">Тема оформления</span>
            <button
              @click="toggleTheme"
              class="theme-toggle"
            >
              <Icon
                :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'"
                class="w-5 h-5"
              />
            </button>
          </div>

          <!-- Services nav mobile -->
          <nav class="grid grid-cols-2 gap-3">
            <NuxtLink
              v-for="item in servicesNav"
              :key="item.href"
              :to="item.href"
              @click="isMenuOpen = false"
              class="flex items-center gap-3 p-4 rounded-xl glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                <Icon :name="item.icon" class="w-5 h-5 text-primary" />
              </div>
              <span class="font-medium">{{ item.name }}</span>
            </NuxtLink>
          </nav>

          <!-- CTA mobile -->
          <NuxtLink
            to="/connect"
            @click="isMenuOpen = false"
            class="btn-primary flex items-center justify-center gap-2 w-full py-4"
          >
            <span>Подключиться</span>
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>
