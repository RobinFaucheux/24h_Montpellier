<script setup lang="ts">
type CityValue = {
  name: string
  code: string
  codeDepartement: string
  codeRegion: string
  region?: string
}

type CitySuggestion = {
  nom: string
  code: string
  codeDepartement: string
  codeRegion: string
  codesPostaux: string[]
}

type CityItem = CityValue & {
  codesPostaux?: string[]
}

const props = defineProps<{
  modelValue?: CityValue | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CityValue | null]
}>()

const selectedCity = ref<CityItem | null>(props.modelValue ? toCityItem(props.modelValue) : null)
const searchTerm = ref(props.modelValue?.name || '')
const cities = ref<CityItem[]>([])
const displayedCities = computed(() => {
  if (!selectedCity.value) return cities.value

  return cities.value.some(city => city.code === selectedCity.value?.code)
    ? cities.value
    : [selectedCity.value, ...cities.value]
})
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>
let searchId = 0

// Mapping code region -> nom region
const regionNames: Record<string, string> = {
  '84': 'Auvergne-Rhône-Alpes',
  '27': 'Bourgogne-Franche-Comté',
  '53': 'Bretagne',
  '24': 'Centre-Val de Loire',
  '94': 'Corse',
  '44': 'Grand Est',
  '32': 'Hauts-de-France',
  '11': 'Île-de-France',
  '28': 'Normandie',
  '75': 'Nouvelle-Aquitaine',
  '76': 'Occitanie',
  '52': 'Pays de la Loire',
  '93': 'Provence-Alpes-Côte d\'Azur',
  '01': 'Guadeloupe',
  '02': 'Martinique',
  '03': 'Guyane',
  '04': 'La Réunion',
  '06': 'Mayotte'
}

function toCityItem(city: CityValue): CityItem {
  return {
    ...city,
    region: city.region || regionNames[city.codeRegion] || ''
  }
}

function toCityValue(city: CityItem): CityValue {
  return {
    name: city.name,
    code: city.code,
    codeDepartement: city.codeDepartement,
    codeRegion: city.codeRegion,
    region: city.region || regionNames[city.codeRegion] || ''
  }
}

async function searchCities(query: string) {
  const currentSearchId = ++searchId

  if (query.length < 2) {
    cities.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    const response = await $fetch<CitySuggestion[]>(
      `https://geo.api.gouv.fr/communes`,
      {
        params: {
          nom: query,
          fields: 'nom,code,codesPostaux,codeDepartement,codeRegion',
          limit: 8
        }
      }
    )
    if (currentSearchId !== searchId) return

    cities.value = response.map(city => ({
      name: city.nom,
      code: city.code,
      codeDepartement: city.codeDepartement,
      codeRegion: city.codeRegion,
      region: regionNames[city.codeRegion] || '',
      codesPostaux: city.codesPostaux
    }))
  } catch {
    if (currentSearchId === searchId) {
      cities.value = []
    }
  } finally {
    if (currentSearchId === searchId) {
      loading.value = false
    }
  }
}

watch(searchTerm, (query) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchCities(query)
  }, 300)
})

watch(selectedCity, (city) => {
  const value = city ? toCityValue(city) : null

  if (value?.code === props.modelValue?.code && value?.name === props.modelValue?.name) return

  if (!value) {
    searchTerm.value = ''
    cities.value = []
  }

  emit('update:modelValue', value)
})

watch(() => props.modelValue, (city) => {
  if (city?.code === selectedCity.value?.code && city?.name === selectedCity.value?.name) return

  selectedCity.value = city ? toCityItem(city) : null
  searchTerm.value = city?.name || ''
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
})
</script>

<template>
  <UInputMenu
    v-model="selectedCity"
    v-model:search-term="searchTerm"
    :items="displayedCities"
    :placeholder="placeholder || 'Rechercher une ville...'"
    icon="i-lucide-map-pin"
    :loading="loading"
    label-key="name"
    by="code"
    ignore-filter
    clear
  >
    <template #item-label="{ item }">
      <div class="min-w-0">
        <p class="font-medium text-sm truncate">{{ item.name }}</p>
        <p class="text-xs text-muted">
          {{ item.codesPostaux?.[0] }} · {{ item.region }}
        </p>
      </div>
    </template>
  </UInputMenu>
</template>
