<script setup lang="ts">
useSeoMeta({
  title: 'Trocdeal — Achetez et vendez près de chez vous',
  description: 'Trocdeal : petites annonces gratuites entre particuliers. Achetez et vendez des objets et services dans toute la France.'
})

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

// Fetch categories
const { data: categories } = await useFetch('/api/categories')

// Fetch recent listings
const { data: recentData, status: recentStatus } = await useFetch('/api/listings', {
  params: { limit: '8', sort: 'recent' }
})

function handleSearch(query: string) {
  navigateTo({
    path: '/annonces',
    query: { q: query }
  })
}

function selectCategory(slug: string) {
  navigateTo({
    path: '/annonces',
    query: { category: slug }
  })
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

        <div class="max-w-2xl mx-auto">
          <SearchBar
            v-model="searchQuery"
            placeholder="Que recherchez-vous ?"
            @search="handleSearch"
          />
        </div>
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
