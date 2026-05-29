<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Déposer une annonce — ScamMarket'
})

const router = useRouter()

// Form data
const title = ref('')
const description = ref('')
const price = ref<number | undefined>()
const categoryIds = ref<string[]>([])
const imageUrls = ref<string[]>([])
const cityData = ref<{ name: string; code: string; codeDepartement: string; codeRegion: string; region?: string } | null>(null)

const loading = ref(false)
const toast = useToast()

// Fetch categories
const { data: categories } = await useFetch('/api/categories')

async function submitListing() {
  if (!title.value.trim()) { toast.add({ title: 'Erreur', description: 'Le titre est requis', color: 'error', icon: 'i-lucide-alert-circle' }); return }
  if (!description.value.trim()) { toast.add({ title: 'Erreur', description: 'La description est requise', color: 'error', icon: 'i-lucide-alert-circle' }); return }
  if (price.value === undefined || price.value < 0) { toast.add({ title: 'Erreur', description: 'Le prix est requis', color: 'error', icon: 'i-lucide-alert-circle' }); return }
  if (!cityData.value) { toast.add({ title: 'Erreur', description: 'La ville est requise', color: 'error', icon: 'i-lucide-alert-circle' }); return }
  if (!categoryIds.value.length) { toast.add({ title: 'Erreur', description: 'Sélectionnez au moins une catégorie', color: 'error', icon: 'i-lucide-alert-circle' }); return }

  loading.value = true
  try {
    const listing = await $fetch('/api/listings', {
      method: 'POST',
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

    navigateTo(`/annonces/${listing.id}`)
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    toast.add({
      title: 'Erreur',
      description: error.data?.message || 'Une erreur est survenue',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
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
      <h1 class="text-3xl font-bold">Déposer une annonce</h1>
      <p class="text-muted mt-2">Remplissez le formulaire ci-dessous pour publier votre annonce</p>
    </div>

    <form @submit.prevent="submitListing" class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold flex items-center gap-2">
            <UIcon name="i-lucide-file-text" />
            Informations principales
          </h2>
        </template>

        <div class="space-y-4">
          <UFormField label="Titre de l'annonce" required>
            <UInput
              v-model="title"
              placeholder="Ex: iPhone 15 Pro Max - Excellent état"
              size="lg"
              class="w-full"
              style="width: 100%;"
            />
          </UFormField>

          <UFormField label="Description" required>
            <UTextarea
              v-model="description"
              placeholder="Décrivez votre article en détail : état, caractéristiques, raison de la vente..."
              :rows="6"
              class="w-full"
              style="width: 100%;"
            />
          </UFormField>

          <UFormField label="Prix (€)" required>
            <UInput
              v-model.number="price"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              icon="i-lucide-euro"
              size="lg"
              class="w-full"
              style="width: 100%;"
            />
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
          <CitySelector v-model="cityData" placeholder="Rechercher votre ville..." />
        </UFormField>

        <p v-if="cityData?.region" class="text-sm text-muted mt-2">
          <UIcon name="i-lucide-navigation" class="inline" />
          Région : {{ cityData.region }}
        </p>
      </UCard>

      <div class="flex items-center gap-4 pt-4">
        <UButton
          type="submit"
          size="lg"
          icon="i-lucide-check"
          label="Publier l'annonce"
          :loading="loading"
          class="flex-1 sm:flex-none"
        />
        <UButton
          variant="ghost"
          label="Annuler"
          @click="router.back()"
        />
      </div>
    </form>
  </div>
</template>
