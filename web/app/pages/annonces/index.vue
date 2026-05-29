<script setup lang="ts">
useSeoMeta({
  title: 'Rechercher des annonces — ScamMarket',
  description: 'Parcourez des milliers de petites annonces. Filtrez par catégorie, localisation et prix.'
})

const route = useRoute()
const router = useRouter()

// Filters
const searchQuery = ref((route.query.q as string) || '')
const selectedCategoryItem = ref<{ label: string, value: string } | null>(null)
const selectedCity = ref((route.query.city as string) || '')
const selectedRegion = ref((route.query.region as string) || '')
const priceMin = ref((route.query.priceMin as string) || '')
const priceMax = ref((route.query.priceMax as string) || '')
const sortOptions = [
  { label: 'Plus récentes', value: 'recent' },
  { label: 'Prix croissant', value: 'price_asc' },
  { label: 'Prix décroissant', value: 'price_desc' }
]
const sortByItem = ref(sortOptions.find(o => o.value === (route.query.sort as string)) ?? sortOptions[0])
const currentPage = ref(parseInt((route.query.page as string) || '1'))

const showFilters = ref(false)

// Fetch categories
const { data: categories } = await useFetch('/api/categories')

const categoryItems = computed(() => [
  { label: 'Toutes les catégories', value: '' },
  ...(categories.value || []).map(c => ({ label: c.name, value: c.slug }))
])

// Init selected category from URL
if (route.query.category) {
  const slug = route.query.category as string
  const match = (categories.value || []).find(c => c.slug === slug)
  if (match) selectedCategoryItem.value = { label: match.name, value: match.slug }
}

// Build query params
const queryParams = computed(() => ({
  q: searchQuery.value || undefined,
  category: selectedCategoryItem.value?.value || undefined,
  city: selectedCity.value || undefined,
  region: selectedRegion.value || undefined,
  priceMin: priceMin.value || undefined,
  priceMax: priceMax.value || undefined,
  sort: sortByItem.value.value,
  page: String(currentPage.value),
  limit: '20'
}))

// Fetch listings
const { data, status, refresh } = await useFetch('/api/listings', {
  params: queryParams,
  watch: [queryParams]
})

// Update URL when filters change
watch(queryParams, (params) => {
  router.replace({ query: params as Record<string, string> })
}, { deep: true })

function handleSearch(query: string) {
  searchQuery.value = query
  currentPage.value = 1
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategoryItem.value = null
  selectedCity.value = ''
  selectedRegion.value = ''
  priceMin.value = ''
  priceMax.value = ''
  sortByItem.value = sortOptions[0]
  currentPage.value = 1
}

const cityRef = ref<{ name: string; region?: string } | null>(null)

watch(cityRef, (val) => {
  if (val) {
    selectedCity.value = val.name
    selectedRegion.value = val.region || ''
  } else {
    selectedCity.value = ''
    selectedRegion.value = ''
  }
  currentPage.value = 1
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedCategoryItem.value?.value || selectedCity.value || priceMin.value || priceMax.value
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Search header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">Rechercher des annonces</h1>
      <SearchBar
        v-model="searchQuery"
        placeholder="Rechercher par titre ou description..."
        @search="handleSearch"
      />
    </div>

    <!-- Filter bar -->
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <UButton
        :icon="showFilters ? 'i-lucide-filter-x' : 'i-lucide-filter'"
        :label="showFilters ? 'Masquer les filtres' : 'Filtres'"
        variant="soft"
        @click="showFilters = !showFilters"
      />

      <UBadge
        v-if="hasActiveFilters"
        variant="subtle"
        class="cursor-pointer"
        @click="clearFilters"
      >
        <UIcon name="i-lucide-x" class="mr-1" />
        Effacer les filtres
      </UBadge>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm text-muted">Trier par :</span>
        <USelectMenu
          v-model="sortByItem"
          :items="sortOptions"
          class="w-44"
        />
      </div>
    </div>

    <!-- Expandable filters -->
    <Transition name="slide">
      <div v-if="showFilters" class="mb-8">
        <UCard>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Category -->
            <UFormField label="Catégorie">
              <USelectMenu
                v-model="selectedCategoryItem"
                :items="categoryItems"
                placeholder="Choisir..."
                class="w-full"
              />
            </UFormField>

            <!-- City -->
            <UFormField label="Ville">
              <CitySelector v-model="cityRef" placeholder="Rechercher une ville..." />
            </UFormField>

            <!-- Price range -->
            <UFormField label="Prix minimum (€)">
              <UInput
                v-model="priceMin"
                type="number"
                placeholder="0"
                icon="i-lucide-euro"
              />
            </UFormField>

            <UFormField label="Prix maximum (€)">
              <UInput
                v-model="priceMax"
                type="number"
                placeholder="∞"
                icon="i-lucide-euro"
              />
            </UFormField>
          </div>
        </UCard>
      </div>
    </Transition>

    <!-- Results count -->
    <div class="mb-4">
      <p class="text-sm text-muted">
        <template v-if="data?.pagination">
          {{ data.pagination.total }} annonce{{ data.pagination.total > 1 ? 's' : '' }} trouvée{{ data.pagination.total > 1 ? 's' : '' }}
        </template>
      </p>
    </div>

    <!-- Listings grid -->
    <ListingGrid
      :listings="data?.listings || []"
      :loading="status === 'pending'"
    />

    <!-- Pagination -->
    <div v-if="data?.pagination && data.pagination.pages > 1" class="mt-8 flex justify-center">
      <UPagination
        v-model="currentPage"
        :total="data.pagination.total"
        :items-per-page="20"
      />
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 300px;
}
</style>
