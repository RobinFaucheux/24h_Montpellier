<script setup lang="ts">
const props = defineProps<{
  listing: {
    id: string
    title: string
    price: number
    city: string
    region: string
    createdAt: string
    images: { url: string }[]
    categories: { name: string; slug: string; icon: string }[]
    user: { name: string; city: string }
  }
  showFavorite?: boolean
}>()

const { loggedIn } = useUserSession()

const isFavorited = ref(false)
const favoriteLoading = ref(false)

async function toggleFavorite() {
  if (!loggedIn.value) {
    navigateTo('/auth/connexion')
    return
  }

  favoriteLoading.value = true
  try {
    if (isFavorited.value) {
      await $fetch(`/api/favorites/${props.listing.id}`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/favorites/${props.listing.id}`, { method: 'POST' })
    }
    isFavorited.value = !isFavorited.value
  } catch (e) {
    console.error('Erreur favori:', e)
  } finally {
    favoriteLoading.value = false
  }
}

const imageUrl = computed(() => {
  if (props.listing.images?.[0]?.url) return props.listing.images[0].url
  return null
})

const timeAgo = computed(() => {
  const date = new Date(props.listing.createdAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `il y a ${minutes}min`
  if (hours < 24) return `il y a ${hours}h`
  if (days < 30) return `il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
})

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(props.listing.price)
})
</script>

<template>
  <div class="listing-card group">
    <UCard class="overflow-hidden h-full" :ui="{ body: 'p-0' }">
      <NuxtLink :to="`/annonces/${listing.id}`" class="block">
        <!-- Image -->
        <div class="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="listing.title"
            class="w-full h-full object-cover gallery-image group-hover:scale-105 transition-transform duration-300"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
          >
            <UIcon name="i-lucide-image" class="text-4xl text-gray-300 dark:text-gray-600" />
          </div>

          <!-- Price badge -->
          <div class="absolute bottom-2 left-2">
            <span class="price-tag text-sm shadow-lg">
              {{ formattedPrice }}
            </span>
          </div>

          <!-- Favorite button -->
          <button
            v-if="showFavorite !== false"
            class="favorite-btn absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors"
            :disabled="favoriteLoading"
            @click.prevent.stop="toggleFavorite"
          >
            <UIcon
              :name="isFavorited ? 'i-lucide-heart' : 'i-lucide-heart'"
              :class="isFavorited ? 'text-red-500' : 'text-gray-400'"
              class="text-lg"
            />
          </button>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-2">
          <h3 class="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {{ listing.title }}
          </h3>

          <div class="flex items-center gap-1 text-xs text-muted">
            <UIcon name="i-lucide-map-pin" class="text-xs shrink-0" />
            <span class="truncate">{{ listing.city }}, {{ listing.region }}</span>
          </div>

          <div class="flex items-center justify-between">
            <div v-if="listing.categories?.length" class="flex flex-wrap gap-1">
              <UBadge
                v-for="cat in listing.categories.slice(0, 2)"
                :key="cat.slug"
                variant="subtle"
                size="xs"
              >
                {{ cat.name }}
              </UBadge>
            </div>
            <span class="text-xs text-muted shrink-0 ml-auto">{{ timeAgo }}</span>
          </div>
        </div>
      </NuxtLink>
    </UCard>
  </div>
</template>
