<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const { data: listing } = await useFetch(`/api/listings/${route.params.id}`)
const { user } = useUserSession()

if (!listing.value || listing.value.userId !== user.value?.id) {
  throw createError({ statusCode: 404, message: 'Annonce non trouvée' })
}

useSeoMeta({
  title: `Modifier : ${listing.value.title} — Trocdeal`
})

// Pre-fill form
const title = ref(listing.value.title)
const description = ref(listing.value.description)
const price = ref(listing.value.price)
const categoryIds = ref(listing.value.categories?.map((c: { id: string }) => c.id) || [])
const imageUrls = ref(listing.value.images?.map((i: { url: string }) => i.url) || [])
const cityData = ref<{ name: string; code: string; codeDepartement: string; codeRegion: string; region?: string } | null>({
  name: listing.value.city,
  code: '',
  codeDepartement: '',
  codeRegion: '',
  region: listing.value.region
})

const loading = ref(false)
const errorMsg = ref('')

const { data: categories } = await useFetch('/api/categories')

async function updateListing() {
  errorMsg.value = ''

  if (!title.value.trim()) { errorMsg.value = 'Le titre est requis'; return }
  if (!description.value.trim()) { errorMsg.value = 'La description est requise'; return }
  if (price.value === undefined || price.value < 0) { errorMsg.value = 'Le prix est requis'; return }
  if (!cityData.value) { errorMsg.value = 'La ville est requise'; return }
  if (!categoryIds.value.length) { errorMsg.value = 'Sélectionnez au moins une catégorie'; return }

  loading.value = true
  try {
    await $fetch(`/api/listings/${route.params.id}`, {
      method: 'PUT',
      body: {
        title: title.value.trim(),
        description: description.value.trim(),
        price: Number(price.value),
        city: cityData.value.name,
        region: cityData.value.region || '',
        categoryIds: categoryIds.value,
        imageUrls: imageUrls.value
      }
    })

    navigateTo(`/annonces/${route.params.id}`)
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    errorMsg.value = error.data?.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

function toggleCategory(id: string) {
  const idx = categoryIds.value.indexOf(id)
  if (idx >= 0) {
    categoryIds.value.splice(idx, 1)
  } else {
    categoryIds.value.push(id)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Modifier l'annonce</h1>
      <p class="text-muted mt-2">Modifiez les informations de votre annonce</p>
    </div>

    <UAlert v-if="errorMsg" icon="i-lucide-alert-circle" :title="errorMsg" color="error" class="mb-6" />

    <form @submit.prevent="updateListing" class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-file-text" />
            Informations principales
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Titre de l'annonce" required>
            <UInput v-model="title" size="lg" class="w-full" style="width: 100%;" />
          </UFormField>
          <UFormField label="Description" required>
            <UTextarea v-model="description" :rows="6" class="w-full" style="width: 100%;" />
          </UFormField>
          <UFormField label="Prix (€)" required>
            <UInput v-model.number="price" type="number" min="0" step="0.01" icon="i-lucide-euro" size="lg" class="w-full" style="width: 100%;" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-image" />
            Photos
          </h2>
        </template>
        <ImageUploader v-model="imageUrls" :max="5" />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-tag" />
            Catégories
          </h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="cat in categories"
            :key="cat.id"
            :variant="categoryIds.includes(cat.id) ? 'solid' : 'outline'"
            :color="categoryIds.includes(cat.id) ? 'primary' : 'neutral'"
            size="sm"
            @click="toggleCategory(cat.id)"
          >
            <UIcon :name="cat.icon" class="mr-1" />
            {{ cat.name }}
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" />
            Localisation
          </h2>
        </template>
        <UFormField label="Ville" required>
          <CitySelector v-model="cityData" />
        </UFormField>
        <p v-if="cityData?.region" class="text-sm text-muted mt-2">
          Région : {{ cityData.region }}
        </p>
      </UCard>

      <div class="flex items-center gap-4 pt-4">
        <UButton type="submit" size="lg" icon="i-lucide-save" label="Enregistrer les modifications" :loading="loading" />
        <UButton variant="ghost" label="Annuler" @click="router.back()" />
      </div>
    </form>
  </div>
</template>
