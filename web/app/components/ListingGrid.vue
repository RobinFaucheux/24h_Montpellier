<script setup lang="ts">
defineProps<{
  listings: Array<{
    id: string
    title: string
    price: number
    city: string
    region: string
    createdAt: string
    images: { url: string }[]
    categories: { name: string; slug: string; icon: string }[]
    user: { name: string; city: string }
  }>
  loading?: boolean
}>()
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="space-y-3">
        <USkeleton class="aspect-[4/3] rounded-lg" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-3 w-1/2" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!listings?.length" class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-5xl text-muted mb-4" />
      <h3 class="text-lg font-semibold mb-2">Aucune annonce trouvée</h3>
      <p class="text-muted">Essayez de modifier vos critères de recherche</p>
    </div>

    <!-- Listings grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ListingCard
        v-for="listing in listings"
        :key="listing.id"
        :listing="listing"
      />
    </div>
  </div>
</template>
