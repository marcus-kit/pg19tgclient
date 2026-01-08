<script setup lang="ts">
/**
 * Диагностическая страница TWA
 */
definePageMeta({
  layout: false
})

const debugInfo = ref<Record<string, any>>({})

onMounted(() => {
  debugInfo.value = {
    timestamp: new Date().toISOString(),
    hasTelegram: typeof window !== 'undefined' && !!window.Telegram,
    hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
    webAppVersion: window.Telegram?.WebApp?.version || 'N/A',
    platform: window.Telegram?.WebApp?.platform || 'N/A',
    colorScheme: window.Telegram?.WebApp?.colorScheme || 'N/A',
    initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
    initDataPreview: window.Telegram?.WebApp?.initData?.substring(0, 100) || 'empty',
    initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || null,
    user: window.Telegram?.WebApp?.initDataUnsafe?.user || null,
  }
})
</script>

<template>
  <div class="min-h-screen p-6 bg-black text-white font-mono text-sm">
    <h1 class="text-xl font-bold mb-4">TWA Debug</h1>

    <div class="space-y-2">
      <div v-for="(value, key) in debugInfo" :key="key" class="p-2 bg-gray-900 rounded">
        <span class="text-green-400">{{ key }}:</span>
        <pre class="text-gray-300 overflow-x-auto">{{ JSON.stringify(value, null, 2) }}</pre>
      </div>
    </div>

    <div class="mt-6 space-y-2">
      <a href="/dashboard" class="block p-3 bg-blue-600 rounded text-center">
        Go to Dashboard
      </a>
      <a href="/twa-required" class="block p-3 bg-gray-600 rounded text-center">
        Go to TWA Required
      </a>
    </div>
  </div>
</template>
