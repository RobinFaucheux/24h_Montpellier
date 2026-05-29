<script setup lang="ts">
const route = useRoute()
const { loggedIn, user } = useUserSession()

const { data: listing, status, refresh } = await useFetch(`/api/listings/${route.params.id}`)

if (!listing.value) {
  throw createError({ statusCode: 404, message: 'Annonce non trouvée' })
}

useSeoMeta({
  title: () => listing.value ? `${listing.value.title} — Trocdeal` : 'Annonce — Trocdeal',
  description: () => listing.value?.description?.slice(0, 160) || ''
})

const currentImageIndex = ref(0)
const showContactModal = ref(false)
const contactMessage = ref('')
const sendingMessage = ref(false)

const isOwner = computed(() => {
  return loggedIn.value && user.value?.id === listing.value?.userId
})

const formattedPrice = computed(() => {
  if (!listing.value) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(listing.value.price)
})

const formattedDate = computed(() => {
  if (!listing.value) return ''
  return new Date(listing.value.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const memberSince = computed(() => {
  if (!listing.value?.user?.createdAt) return ''
  return new Date(listing.value.user.createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  })
})

// Favorite toggle
const isFavorited = ref(listing.value?.isFavorited || false)
const favLoading = ref(false)

async function toggleFavorite() {
  if (!loggedIn.value) {
    navigateTo('/auth/connexion')
    return
  }
  favLoading.value = true
  try {
    if (isFavorited.value) {
      await $fetch(`/api/favorites/${route.params.id}`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/favorites/${route.params.id}`, { method: 'POST' })
    }
    isFavorited.value = !isFavorited.value
  } catch (e) {
    console.error(e)
  } finally {
    favLoading.value = false
  }
}

// Contact
async function sendContactMessage() {
  if (!contactMessage.value.trim()) return
  sendingMessage.value = true
  try {
    const result = await $fetch('/api/conversations', {
      method: 'POST',
      body: {
        listingId: route.params.id,
        message: contactMessage.value.trim()
      }
    })
    showContactModal.value = false
    contactMessage.value = ''
    navigateTo(`/mon-compte/messages?conversation=${result.conversationId}`)
  } catch (e) {
    console.error(e)
  } finally {
    sendingMessage.value = false
  }
}

function prevImage() {
  if (!listing.value?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + listing.value.images.length) % listing.value.images.length
}

function nextImage() {
  if (!listing.value?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % listing.value.images.length
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <UBreadcrumb :items="[
        { label: 'Accueil', to: '/' },
        { label: 'Annonces', to: '/annonces' },
        { label: listing?.title || '...' }
      ]" />
    </div>

    <div v-if="listing" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Images + Description -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Image Gallery -->
        <div class="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <template v-if="listing.images?.length">
            <img
              :src="listing.images[currentImageIndex].url"
              :alt="listing.title"
              class="w-full h-full object-contain"
            />

            <!-- Nav arrows -->
            <template v-if="listing.images.length > 1">
              <button
                class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                @click="prevImage"
              >
                <UIcon name="i-lucide-chevron-left" />
              </button>
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                @click="nextImage"
              >
                <UIcon name="i-lucide-chevron-right" />
              </button>

              <!-- Dots -->
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                <button
                  v-for="(_, i) in listing.images"
                  :key="i"
                  class="w-2 h-2 rounded-full transition-colors"
                  :class="i === currentImageIndex ? 'bg-white' : 'bg-white/50'"
                  @click="currentImageIndex = i"
                />
              </div>
            </template>
          </template>

          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-image" class="text-6xl text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        <!-- Thumbnails -->
        <div v-if="listing.images?.length > 1" class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="(img, i) in listing.images"
            :key="img.id"
            class="w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0"
            :class="i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'"
            @click="currentImageIndex = i"
          >
            <img :src="img.url" class="w-full h-full object-cover" />
          </button>
        </div>

        <!-- Description -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-lg">Description</h2>
          </template>
          <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ listing.description }}</p>
        </UCard>
      </div>

      <!-- Right sidebar -->
      <div class="space-y-6">
        <!-- Price & Title -->
        <UCard>
          <div class="space-y-4">
            <div>
              <span class="price-tag text-xl">{{ formattedPrice }}</span>
            </div>

            <h1 class="text-xl font-bold">{{ listing.title }}</h1>

            <!-- Categories -->
            <div v-if="listing.categories?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="cat in listing.categories"
                :key="cat.slug"
                variant="subtle"
                size="sm"
              >
                <UIcon :name="cat.icon" class="mr-1" />
                {{ cat.name }}
              </UBadge>
            </div>

            <!-- Location -->
            <div class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-map-pin" />
              <span>{{ listing.city }}, {{ listing.region }}</span>
            </div>

            <!-- Date -->
            <div class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-calendar" />
              <span>Publiée le {{ formattedDate }}</span>
            </div>

            <USeparator />

            <!-- Actions -->
            <div v-if="!isOwner" class="space-y-2">
              <UButton
                block
                size="lg"
                icon="i-lucide-message-circle"
                label="Contacter le vendeur"
                @click="loggedIn ? (showContactModal = true) : navigateTo('/auth/connexion')"
              />
              <UButton
                block
                variant="soft"
                :icon="isFavorited ? 'i-lucide-heart' : 'i-lucide-heart'"
                :label="isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                :color="isFavorited ? 'red' : 'neutral'"
                :loading="favLoading"
                @click="toggleFavorite"
              />
            </div>

            <div v-else class="space-y-2">
              <UButton
                block
                variant="soft"
                icon="i-lucide-pencil"
                label="Modifier l'annonce"
                :to="`/annonces/${listing.id}/modifier`"
              />
            </div>
          </div>
        </UCard>

        <!-- Seller info -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Vendeur</h3>
          </template>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon name="i-lucide-user" class="text-xl text-primary" />
              </div>
              <div>
                <p class="font-semibold">{{ listing.user.name }}</p>
                <p v-if="listing.user.city" class="text-sm text-muted">{{ listing.user.city }}</p>
              </div>
            </div>

            <p v-if="memberSince" class="text-xs text-muted">
              Membre depuis {{ memberSince }}
            </p>

            <!-- Phone number -->
            <div v-if="listing.user.phone" class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-phone" class="text-muted" />
              <a :href="`tel:${listing.user.phone}`" class="text-primary hover:underline">
                {{ listing.user.phone }}
              </a>
            </div>
          </div>
        </UCard>

        <!-- Hidden badge for owner -->
        <UAlert
          v-if="isOwner && listing.isHidden"
          icon="i-lucide-eye-off"
          title="Annonce masquée"
          description="Cette annonce n'est pas visible par les autres utilisateurs."
          color="warning"
        />
      </div>
    </div>

    <!-- Contact Modal -->
    <UModal v-model:open="showContactModal">
      <template #header>
        <h3 class="text-lg font-semibold">Contacter {{ listing?.user?.name }}</h3>
      </template>
      <template #body>
        <div class="space-y-4 p-4">
          <p class="text-sm text-muted">
            À propos de : <strong>{{ listing?.title }}</strong>
          </p>
          <UFormField label="Votre message">
            <UTextarea
              v-model="contactMessage"
              placeholder="Bonjour, je suis intéressé(e) par votre annonce..."
              :rows="4"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="showContactModal = false" />
          <UButton
            icon="i-lucide-send"
            label="Envoyer"
            :loading="sendingMessage"
            :disabled="!contactMessage.trim()"
            @click="sendContactMessage"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
