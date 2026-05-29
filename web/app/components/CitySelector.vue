<script setup lang="ts">
const props = defineProps<{
  modelValue?: { name: string; code: string; codeDepartement: string; codeRegion: string; region?: string } | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { name: string; code: string; codeDepartement: string; codeRegion: string; region?: string } | null]
}>()

const searchQuery = ref(props.modelValue?.name || '')
const suggestions = ref<Array<{ nom: string; code: string; codeDepartement: string; codeRegion: string; codesPostaux: string[]; population: number }>>([])
const showSuggestions = ref(false)
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>

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

async function searchCities(query: string) {
  if (query.length < 2) {
    suggestions.value = []
    return
  }

  loading.value = true
  try {
    const response = await $fetch<Array<{ nom: string; code: string; codeDepartement: string; codeRegion: string; codesPostaux: string[]; population: number }>>(
      `https://geo.api.gouv.fr/communes`,
      {
        params: {
          nom: query,
          fields: 'nom,code,codesPostaux,codeDepartement,codeRegion,population',
          limit: 8,
          boost: 'population'
        }
      }
    )
    suggestions.value = response
  } catch {
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchCities(searchQuery.value)
    showSuggestions.value = true
  }, 300)
}

function selectCity(city: typeof suggestions.value[0]) {
  const region = regionNames[city.codeRegion] || ''
  searchQuery.value = city.nom
  showSuggestions.value = false
  emit('update:modelValue', {
    name: city.nom,
    code: city.code,
    codeDepartement: city.codeDepartement,
    codeRegion: city.codeRegion,
    region
  })
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function clear() {
  searchQuery.value = ''
  suggestions.value = []
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="relative">
    <UInput
      v-model="searchQuery"
      :placeholder="placeholder || 'Rechercher une ville...'"
      icon="i-lucide-map-pin"
      :loading="loading"
      autocomplete="off"
      @input="onInput"
      @focus="searchQuery.length >= 2 && (showSuggestions = true)"
      @blur="handleBlur"
    >
      <template #trailing v-if="searchQuery">
        <UButton
          icon="i-lucide-x"
          variant="link"
          color="neutral"
          size="xs"
          @click="clear"
          aria-label="Effacer"
        />
      </template>
    </UInput>

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && suggestions.length"
      class="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
    >
      <button
        v-for="city in suggestions"
        :key="city.code"
        class="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
        @mousedown.prevent="selectCity(city)"
      >
        <UIcon name="i-lucide-map-pin" class="text-muted shrink-0" />
        <div class="min-w-0">
          <p class="font-medium text-sm truncate">{{ city.nom }}</p>
          <p class="text-xs text-muted">
            {{ city.codesPostaux?.[0] }} · {{ regionNames[city.codeRegion] || '' }}
          </p>
        </div>
        <span class="ml-auto text-xs text-muted shrink-0">
          {{ city.population?.toLocaleString('fr-FR') }} hab.
        </span>
      </button>
    </div>
  </div>
</template>
