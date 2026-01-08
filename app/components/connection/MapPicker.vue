<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapControls,
  YandexMapZoomControl,
  YandexMapMarker,
  YandexMapFeature,
  YandexMapListener
} from 'vue-yandex-maps'

interface AddressValue {
  text: string
  coordinates: [number, number] | null
  components: Record<string, any> | null
}

interface Props {
  modelValue?: AddressValue
  showCoverageZone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ text: '', coordinates: null, components: null }),
  showCoverageZone: true
})

const emit = defineEmits<{
  'update:modelValue': [value: AddressValue]
  'coverage-check': [result: any]
}>()

// Composables
const { reverseGeocode } = useYandexGeocoder()
const { checkCoverage } = useCoverageCheck()

// Map state
const mapCenter = ref<[number, number]>([39.7015, 47.2357]) // [lon, lat] для API 3.0 — Ростов-на-Дону
const mapZoom = ref(12)
const markerCoords = ref<[number, number] | null>(null)
const markerColor = ref<string>('#F7941D') // primary color
const isProcessing = ref(false)
const coverageZones = ref<any[]>([])

// Загрузка зон покрытия (упрощённая версия)
const loadCoverageZones = async () => {
  // TODO: Загружать реальные зоны через API
  coverageZones.value = []
}

// Обработка клика по карте (через YandexMapListener)
const handleMapClick = async (object: any, event: any) => {
  if (isProcessing.value) return

  // YandexMapListener передаёт coordinates в event
  // Формат: [lon, lat] для API 3.0
  let coords: [number, number] | null = null

  // Пробуем разные форматы событий
  if (event?.coordinates) {
    coords = event.coordinates as [number, number]
  } else if (event?.entity?.geometry?.coordinates) {
    coords = event.entity.geometry.coordinates as [number, number]
  } else if (Array.isArray(event) && event.length === 2) {
    coords = event as [number, number]
  }

  if (!coords) {
    console.warn('MapPicker: no coordinates in click event', { object, event })
    return
  }

  await processMapClick(coords)
}

// Обработка выбора точки
const processMapClick = async (coords: [number, number]) => {
  isProcessing.value = true
  // Сохраняем в формате [lon, lat] для API 3.0
  markerCoords.value = coords

  try {
    // Обратное геокодирование: координаты → адрес
    // reverseGeocode ожидает [lat, lon], поэтому переворачиваем
    const [lon, lat] = coords
    const geocodeResult = await reverseGeocode(lat, lon)

    // Проверка зоны покрытия
    const coverage = await checkCoverage(lat, lon)

    // Устанавливаем цвет маркера
    markerColor.value = coverage.inCoverage ? '#00A651' : '#EF4444' // green : red

    // Обновляем значение — координаты в формате [lat, lon] для совместимости
    const addressValue: AddressValue = {
      text: geocodeResult.address,
      coordinates: geocodeResult.coordinates,
      components: geocodeResult.components
    }

    emit('update:modelValue', addressValue)
    emit('coverage-check', coverage)
  } catch (error) {
    console.error('Map click error:', error)
    markerColor.value = '#F7941D' // primary (neutral)
  } finally {
    isProcessing.value = false
  }
}

// Fallback определение местоположения по IP
const getLocationByIp = async (): Promise<[number, number] | null> => {
  try {
    const response = await $fetch<{
      success: boolean
      coordinates: [number, number]
      city?: string
      accuracy: string
    }>('/api/geolocation/ip')

    if (response.success && response.coordinates) {
      return response.coordinates
    }
    return null
  } catch (error) {
    console.error('IP geolocation error:', error)
    return null
  }
}

// Геолокация пользователя с fallback на IP
const useMyLocation = async () => {
  isProcessing.value = true

  // Пробуем браузерную геолокацию
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        })
      })

      // Координаты в формате [lon, lat] для API 3.0
      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude
      ]

      mapCenter.value = coords
      mapZoom.value = 15

      // Обрабатываем как клик
      await processMapClick(coords)
      return
    } catch (error: any) {
      console.warn('Browser geolocation failed, trying IP fallback:', error.message)
    }
  }

  // Fallback: определяем по IP
  const ipCoords = await getLocationByIp()

  if (ipCoords) {
    // IP возвращает [lat, lon], конвертируем в [lon, lat] для API 3.0
    const [lat, lon] = ipCoords
    const coords: [number, number] = [lon, lat]

    mapCenter.value = coords
    mapZoom.value = 13 // Меньший zoom т.к. IP менее точен

    // Обрабатываем как клик
    await processMapClick(coords)
  } else {
    isProcessing.value = false
    alert('Не удалось определить ваше местоположение. Выберите адрес на карте вручную.')
  }
}

// Следим за изменениями извне
watch(() => props.modelValue.coordinates, (newCoords) => {
  if (newCoords) {
    // modelValue.coordinates в формате [lat, lon], конвертируем в [lon, lat]
    const [lat, lon] = newCoords
    const apiCoords: [number, number] = [lon, lat]
    if (markerCoords.value?.[0] !== apiCoords[0] || markerCoords.value?.[1] !== apiCoords[1]) {
      markerCoords.value = apiCoords
      mapCenter.value = apiCoords
    }
  }
})

// Загрузка зон при монтировании
if (props.showCoverageZone) {
  loadCoverageZones()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Контролы -->
    <div class="glass-card p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="useMyLocation"
          :disabled="isProcessing"
          type="button"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Icon name="heroicons:map-pin" class="w-4 h-4" />
          <span>Моё местоположение</span>
        </button>
      </div>

      <div class="text-sm text-[var(--text-muted)]">
        <Icon v-if="isProcessing" name="heroicons:arrow-path" class="w-4 h-4 inline animate-spin mr-1" />
        <span v-else>Кликните на карте для выбора адреса</span>
      </div>
    </div>

    <!-- Карта -->
    <div class="glass-card p-4">
      <ClientOnly>
        <yandex-map
          height="500px"
          width="100%"
          :settings="{
            location: {
              center: mapCenter,
              zoom: mapZoom
            }
          }"
        >
          <!-- Слои карты (обязательно для API 3.0!) -->
          <yandex-map-default-scheme-layer />
          <yandex-map-default-features-layer />

          <!-- Обработчик кликов по карте (API 3.0) -->
          <yandex-map-listener :settings="{ onClick: handleMapClick }" />

          <!-- Контролы -->
          <yandex-map-controls :settings="{ position: 'right' }">
            <yandex-map-zoom-control />
          </yandex-map-controls>

          <!-- Маркер выбранной точки -->
          <yandex-map-marker
            v-if="markerCoords"
            :settings="{ coordinates: markerCoords }"
          >
            <div class="marker-container -translate-x-1/2 -translate-y-full">
              <!-- Сам маркер -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center shadow-xl animate-bounce-in"
                :style="{ backgroundColor: markerColor }"
              >
                <Icon name="heroicons:map-pin" class="w-6 h-6 text-white" />
              </div>
              <!-- Тень под маркером -->
              <div class="w-4 h-1 bg-black/30 rounded-full mx-auto mt-1 blur-sm"></div>
            </div>
          </yandex-map-marker>

          <!-- Зоны покрытия (если включено) -->
          <template v-if="showCoverageZone && coverageZones.length > 0">
            <yandex-map-feature
              v-for="zone in coverageZones"
              :key="zone.id"
              :settings="{
                geometry: zone.geometry,
                style: {
                  fill: 'rgba(0, 166, 81, 0.3)',
                  stroke: [{ color: '#00A651', width: 2 }]
                }
              }"
            />
          </template>
        </yandex-map>

        <template #fallback>
          <div class="w-full h-[500px] rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-[var(--text-muted)]">Загрузка карты...</p>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Подсказка -->
      <div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-blue-500 font-medium mb-1">Как выбрать адрес</p>
            <p class="text-sm text-[var(--text-muted)]">
              Кликните на карте в нужной точке. Система автоматически определит адрес и проверит зону покрытия.
              <span v-if="markerCoords" class="block mt-1">
                Выбранный адрес: <span class="text-[var(--text-primary)]">{{ modelValue.text || 'Определяется...' }}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Анимация появления маркера */
@keyframes bounce-in {
  0% {
    transform: scale(0) translateY(-20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(0);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.4s ease-out forwards;
}

/* Контейнер маркера для правильного позиционирования */
.marker-container {
  position: relative;
  cursor: pointer;
}
</style>
