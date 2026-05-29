<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Mon profil — Trocdeal' })

const { user, clear, fetch: refreshSession } = useUserSession()
const { formatPrice, CURRENCY_NAME, CURRENCY_SYMBOL } = useCurrency()

const { data: profile, refresh } = await useFetch('/api/users/me')

const name = ref(profile.value?.name || '')
const phone = ref(profile.value?.phone || '')
const cityData = ref<{ name: string; code: string; codeDepartement: string; codeRegion: string; region?: string } | null>(
  profile.value?.city
    ? { name: profile.value.city, code: '', codeDepartement: '', codeRegion: '', region: profile.value.region || '' }
    : null
)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')

const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)

async function updateProfile() {
  errorMsg.value = ''
  successMsg.value = ''

  if (newPassword.value && newPassword.value !== newPasswordConfirm.value) {
    errorMsg.value = 'Les nouveaux mots de passe ne correspondent pas'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/users/me', {
      method: 'PUT',
      body: {
        name: name.value,
        phone: phone.value,
        city: cityData.value?.name || '',
        region: cityData.value?.region || '',
        ...(newPassword.value && {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value
        })
      }
    })

    await refreshSession()
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
    successMsg.value = 'Profil mis à jour avec succès'
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    errorMsg.value = error.data?.message || 'Erreur lors de la mise à jour'
  } finally {
    loading.value = false
  }
}

async function deleteAccount() {
  deleteLoading.value = true
  try {
    await $fetch('/api/users/me', { method: 'DELETE' })
    await clear()
    navigateTo('/')
  } catch (e) {
    console.error(e)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">Mon profil</h1>
    <p class="text-muted mb-8">Gérez vos informations personnelles</p>

    <!-- Navigation tabs -->
    <div class="flex gap-2 mb-8 flex-wrap">
      <UButton to="/mon-compte" variant="soft" icon="i-lucide-user" label="Profil" />
      <UButton to="/mon-compte/mes-annonces" variant="ghost" icon="i-lucide-package" label="Mes annonces" />
      <UButton to="/mon-compte/favoris" variant="ghost" icon="i-lucide-heart" label="Favoris" />
      <UButton to="/mon-compte/messages" variant="ghost" icon="i-lucide-message-circle" label="Messages" />
    </div>

    <!-- Balance card -->
    <UCard class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-coins" class="text-primary text-xl" />
          </div>
          <div>
            <p class="text-sm text-muted">Mon solde {{ CURRENCY_NAME }}</p>
            <p class="text-2xl font-bold text-primary">{{ formatPrice(profile?.balance ?? 0) }}</p>
          </div>
        </div>
        <UBadge variant="subtle" size="lg">{{ CURRENCY_SYMBOL }}</UBadge>
      </div>
    </UCard>

    <UAlert v-if="successMsg" icon="i-lucide-check-circle" :title="successMsg" color="success" class="mb-6" />
    <UAlert v-if="errorMsg" icon="i-lucide-alert-circle" :title="errorMsg" color="error" class="mb-6" />

    <form @submit.prevent="updateProfile" class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold">Informations personnelles</h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Email">
            <UInput :model-value="profile?.email" disabled icon="i-lucide-mail" />
          </UFormField>

          <UFormField label="Nom complet">
            <UInput v-model="name" icon="i-lucide-user" />
          </UFormField>

          <UFormField label="Téléphone" hint="Visible sur vos annonces">
            <UInput v-model="phone" type="tel" icon="i-lucide-phone" placeholder="06 12 34 56 78" />
          </UFormField>

          <UFormField label="Ville">
            <CitySelector v-model="cityData" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Changer le mot de passe</h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Mot de passe actuel">
            <UInput v-model="currentPassword" type="password" icon="i-lucide-lock" />
          </UFormField>
          <UFormField label="Nouveau mot de passe">
            <UInput v-model="newPassword" type="password" icon="i-lucide-lock" placeholder="Minimum 6 caractères" />
          </UFormField>
          <UFormField label="Confirmer le nouveau mot de passe">
            <UInput v-model="newPasswordConfirm" type="password" icon="i-lucide-lock" />
          </UFormField>
        </div>
      </UCard>

      <div class="flex items-center justify-end">
        <UButton type="submit" size="lg" icon="i-lucide-save" label="Enregistrer" :loading="loading" />
      </div>
    </form>

    <!-- Delete account -->
    <UCard class="mt-12 border-red-200 dark:border-red-900">
      <template #header>
        <h2 class="font-semibold text-red-600">Zone dangereuse</h2>
      </template>
      <p class="text-sm text-muted mb-4">
        La suppression de votre compte est irréversible. Toutes vos annonces, messages et données seront définitivement supprimés.
      </p>
      <UButton
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="Supprimer mon compte"
        @click="showDeleteConfirm = true"
      />
    </UCard>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteConfirm">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Confirmer la suppression</h3>
      </template>
      <template #body>
        <p class="p-4">
          Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est <strong>irréversible</strong>.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="showDeleteConfirm = false" />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Oui, supprimer mon compte"
            :loading="deleteLoading"
            @click="deleteAccount"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
