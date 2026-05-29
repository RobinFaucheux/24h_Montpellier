<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Mes favoris — ScamMarket' })

const { data: favorites, refresh, status } = await useFetch('/api/favorites')

const listings = computed(() => {
  return (favorites.value || []).map((f: { listing: unknown }) => f.listing)
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">Mes favoris</h1>
    <p class="text-muted mb-8">Retrouvez les annonces que vous avez mises en favori</p>

    <!-- Navigation tabs -->
    <div class="flex gap-2 mb-8 flex-wrap">
      <UButton to="/mon-compte" variant="ghost" icon="i-lucide-user" label="Profil" />
      <UButton to="/mon-compte/mes-annonces" variant="ghost" icon="i-lucide-package" label="Mes annonces" />
      <UButton to="/mon-compte/favoris" variant="soft" icon="i-lucide-heart" label="Favoris" />
      <UButton to="/mon-compte/messages" variant="ghost" icon="i-lucide-message-circle" label="Messages" />
    </div>

    <ListingGrid
      :listings="listings"
      :loading="status === 'pending'"
    />
  </div>
</template>
