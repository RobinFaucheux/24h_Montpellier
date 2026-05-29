<script setup lang="ts">
useSeoMeta({
  title: 'Trocdeal — Achetez et vendez près de chez vous',
  description: 'Trocdeal : petites annonces gratuites entre particuliers. Achetez et vendez des objets et services dans toute la France.'
})

const searchQuery = ref('')
const selectedCategoryItem = ref<{ label: string, value: string, icon: string } | null>(null)
const cityRef = ref<{ name: string; region?: string } | null>(null)
const priceMin = ref('')
const priceMax = ref('')
const { ids: recentlyViewedIds, ready: recentlyViewedReady, clearRecentlyViewedListings } = useRecentlyViewedListings()

// Fetch categories
const { data: categories } = await useFetch('/api/categories', { key: 'categories' })

const categoryItems = computed(() => {
  const cats = categories.value
  if (!cats?.length) return [{ label: 'Toutes catégories', value: '' }]
  return [
    { label: 'Toutes catégories', value: '' },
    ...cats.map(c => ({ label: c.name, value: c.slug, icon: c.icon }))
  ]
})

// Fetch recent listings
const { data: recentData, status: recentStatus } = await useFetch('/api/listings', {
  key: 'home-recent-listings',
  params: { limit: '8', sort: 'recent' }
})

const { data: recentlyViewedData, status: recentlyViewedStatus } = await useFetch('/api/listings/batch', {
  server: false,
  params: computed(() => ({ ids: recentlyViewedIds.value.join(',') })),
  watch: [recentlyViewedIds]
})

const recentlyViewedListings = computed(() => recentlyViewedData.value?.listings || [])
const shouldShowRecentlyViewed = computed(() => (
  recentlyViewedReady.value
  && recentlyViewedIds.value.length > 0
  && (recentlyViewedStatus.value === 'pending' || recentlyViewedListings.value.length > 0)
))

function handleSearch() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedCategoryItem.value?.value) query.category = selectedCategoryItem.value.value
  if (cityRef.value?.name) query.city = cityRef.value.name
  if (cityRef.value?.region) query.region = cityRef.value.region
  if (priceMin.value) query.priceMin = priceMin.value
  if (priceMax.value) query.priceMax = priceMax.value
  navigateTo({ path: '/annonces', query })
}

function selectCategory(slug: string) {
  navigateTo({
    path: '/annonces',
    query: { category: slug }
  })
}

function clearRecentlyViewed() {
  clearRecentlyViewedListings()
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="hero-gradient py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
          Trouvez la
          <span class="text-yellow-300">bonne affaire</span>
          <br />près de chez vous
        </h1>
        <p class="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          Des milliers d'annonces entre particuliers. Achetez, vendez et échangez en toute simplicité.
        </p>

        <UCard class="max-w-3xl mx-auto" :ui="{ body: 'p-4' }">
          <form class="space-y-3" @submit.prevent="handleSearch">
            <!-- Search input -->
            <div class="flex gap-2">
              <UInput
                v-model="searchQuery"
                placeholder="Que recherchez-vous ?"
                icon="i-lucide-search"
                size="lg"
                class="flex-1"
              />
              <UButton
                type="submit"
                label="Rechercher"
                icon="i-lucide-search"
                size="lg"
                class="hidden sm:flex"
              />
              <UButton
                type="submit"
                icon="i-lucide-search"
                size="lg"
                class="sm:hidden"
                aria-label="Rechercher"
              />
            </div>

            <!-- Filters row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <USelectMenu
                v-model="selectedCategoryItem"
                :items="categoryItems"
                :icon="selectedCategoryItem?.icon"
                placeholder="Catégorie"
                class="w-full"
              />
              <CitySelector
                v-model="cityRef"
                placeholder="Ville"
              />
              <UInput
                v-model="priceMin"
                type="number"
                placeholder="Prix min (€)"
                icon="i-lucide-euro"
                min="0"
              />
              <UInput
                v-model="priceMax"
                type="number"
                placeholder="Prix max (€)"
                icon="i-lucide-euro"
                min="0"
              />
            </div>
          </form>
        </UCard>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold mb-6">Parcourir par catégorie</h2>

        <div class="flex flex-wrap gap-3">
          <CategoryBadge
            v-for="cat in categories"
            :key="cat.slug"
            :category="cat"
            :active="selectedCategory === cat.slug"
            @click="selectCategory(cat.slug)"
          />
        </div>
      </div>
    </section>

    <!-- Recently viewed listings -->
    <section
      v-if="shouldShowRecentlyViewed"
      class="py-12 px-4 hero-gradient-subtle"
    >
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Annonces récemment consultées</h2>
          <UButton
            variant="ghost"
            label="Effacer l'historique"
            icon="i-lucide-trash-2"
            @click="clearRecentlyViewed"
          />
        </div>

        <ListingGrid
          :listings="recentlyViewedListings"
          :loading="recentlyViewedStatus === 'pending'"
        />
      </div>
    </section>

    <!-- Recent Listings -->
    <section class="py-12 px-4 hero-gradient-subtle">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Annonces récentes</h2>
          <UButton
            to="/annonces"
            variant="ghost"
            label="Voir tout"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>

        <ListingGrid
          :listings="recentData?.listings || []"
          :loading="recentStatus === 'pending'"
        />
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <UIcon name="i-lucide-megaphone" class="text-5xl text-primary mb-4" />
        <h2 class="text-3xl font-bold mb-4">Vous avez quelque chose à vendre ?</h2>
        <p class="text-lg text-muted mb-8 max-w-xl mx-auto">
          Déposez votre annonce gratuitement en quelques minutes et touchez des milliers d'acheteurs potentiels.
        </p>
        <UButton
          to="/annonces/nouvelle"
          size="xl"
          icon="i-lucide-plus-circle"
          label="Déposer une annonce"
        />
      </div>
    </section>
  </div>
</template>
