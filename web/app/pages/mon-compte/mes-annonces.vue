<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Mes annonces — ScamMarket' })

const { data: listings, refresh, status } = await useFetch('/api/listings/my')

const deleteTarget = ref<string | null>(null)
const deleteLoading = ref(false)
const toggleLoading = ref<string | null>(null)
const showDeleteModal = ref(false)

async function toggleVisibility(id: string) {
  toggleLoading.value = id
  try {
    await $fetch(`/api/listings/${id}/toggle-visibility`, { method: 'POST' })
    await refresh()
  } catch (e) {
    console.error(e)
  } finally {
    toggleLoading.value = null
  }
}

async function deleteListing() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/listings/${deleteTarget.value}`, { method: 'DELETE' })
    showDeleteModal.value = false
    deleteTarget.value = null
    await refresh()
  } catch (e) {
    console.error(e)
  } finally {
    deleteLoading.value = false
  }
}

const { formatPrice } = useCurrency()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-2">
      <h1 class="text-3xl font-bold">Mes annonces</h1>
      <UButton to="/annonces/nouvelle" icon="i-lucide-plus" label="Nouvelle annonce" />
    </div>
    <p class="text-muted mb-8">Gérez toutes vos annonces depuis cette page</p>

    <!-- Navigation tabs -->
    <div class="flex gap-2 mb-8 flex-wrap">
      <UButton to="/mon-compte" variant="ghost" icon="i-lucide-user" label="Profil" />
      <UButton to="/mon-compte/mes-annonces" variant="soft" icon="i-lucide-package" label="Mes annonces" />
      <UButton to="/mon-compte/favoris" variant="ghost" icon="i-lucide-heart" label="Favoris" />
      <UButton to="/mon-compte/messages" variant="ghost" icon="i-lucide-message-circle" label="Messages" />
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-24 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!listings?.length" class="text-center py-16">
      <UIcon name="i-lucide-package" class="text-5xl text-muted mb-4" />
      <h3 class="text-lg font-semibold mb-2">Aucune annonce</h3>
      <p class="text-muted mb-6">Vous n'avez pas encore publié d'annonce</p>
      <UButton to="/annonces/nouvelle" icon="i-lucide-plus" label="Déposer ma première annonce" />
    </div>

    <!-- Listings list -->
    <div v-else class="space-y-4">
      <UCard v-for="listing in listings" :key="listing.id" :class="listing.isHidden && 'opacity-60'">
        <div class="flex items-start gap-4">
          <!-- Image -->
          <NuxtLink :to="`/annonces/${listing.id}`" class="shrink-0">
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                v-if="listing.images?.[0]?.url"
                :src="listing.images[0].url"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-image" class="text-muted" />
              </div>
            </div>
          </NuxtLink>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/annonces/${listing.id}`" class="hover:text-primary transition-colors">
              <h3 class="font-semibold truncate">{{ listing.title }}</h3>
            </NuxtLink>
            <p class="text-lg font-bold text-primary">{{ formatPrice(listing.price) }}</p>
            <div class="flex items-center gap-4 text-xs text-muted mt-1">
              <span>{{ formatDate(listing.createdAt) }}</span>
              <span>{{ listing.city }}</span>
              <span v-if="listing._count?.favorites">❤️ {{ listing._count.favorites }}</span>
              <span v-if="listing._count?.conversations">💬 {{ listing._count.conversations }}</span>
              <UBadge v-if="listing.isHidden" variant="subtle" color="warning" size="xs">Masquée</UBadge>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              :to="`/annonces/${listing.id}/modifier`"
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Modifier"
            />
            <UButton
              :icon="listing.isHidden ? 'i-lucide-eye' : 'i-lucide-eye-off'"
              variant="ghost"
              color="neutral"
              size="sm"
              :loading="toggleLoading === listing.id"
              :aria-label="listing.isHidden ? 'Afficher' : 'Masquer'"
              @click="toggleVisibility(listing.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              aria-label="Supprimer"
              @click="deleteTarget = listing.id; showDeleteModal = true"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Delete confirmation -->
    <UModal v-model:open="showDeleteModal" @close="deleteTarget = null">
      <template #header>
        <h3 class="text-lg font-semibold">Supprimer l'annonce</h3>
      </template>
      <template #body>
        <p class="p-4">Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="showDeleteModal = false; deleteTarget = null" />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Supprimer"
            :loading="deleteLoading"
            @click="deleteListing"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
