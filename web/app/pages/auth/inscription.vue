<script setup lang="ts">
useSeoMeta({ title: 'Inscription — Trocdeal' })

const { fetch: refreshSession } = useUserSession()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function register() {
  errorMsg.value = ''

  if (password.value !== passwordConfirm.value) {
    errorMsg.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value || undefined
      }
    })

    await refreshSession()
    navigateTo('/')
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    errorMsg.value = error.data?.message || 'Erreur lors de l\'inscription'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
          <UIcon name="i-lucide-user-plus" class="text-white text-3xl" />
        </div>
        <h1 class="text-2xl font-bold">Créer un compte</h1>
        <p class="text-muted mt-2">Rejoignez Trocdeal et commencez à vendre</p>
      </div>

      <UCard>
        <form @submit.prevent="register" class="space-y-4">
          <UAlert v-if="errorMsg" icon="i-lucide-alert-circle" :title="errorMsg" color="error" />

          <UFormField label="Nom complet" required>
            <UInput
              v-model="name"
              placeholder="Marie Dupont"
              icon="i-lucide-user"
              size="lg"
              required
              autofocus
            />
          </UFormField>

          <UFormField label="Email" required>
            <UInput
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              icon="i-lucide-mail"
              size="lg"
              required
            />
          </UFormField>

          <UFormField label="Numéro de téléphone" hint="Optionnel — visible sur vos annonces">
            <UInput
              v-model="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              icon="i-lucide-phone"
              size="lg"
            />
          </UFormField>

          <UFormField label="Mot de passe" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="Minimum 6 caractères"
              icon="i-lucide-lock"
              size="lg"
              required
            />
          </UFormField>

          <UFormField label="Confirmer le mot de passe" required>
            <UInput
              v-model="passwordConfirm"
              type="password"
              placeholder="Retapez votre mot de passe"
              icon="i-lucide-lock"
              size="lg"
              required
            />
          </UFormField>

          <UButton
            type="submit"
            block
            size="lg"
            icon="i-lucide-user-plus"
            label="Créer mon compte"
            :loading="loading"
          />
        </form>

        <template #footer>
          <p class="text-center text-sm text-muted">
            Déjà un compte ?
            <NuxtLink to="/auth/connexion" class="text-primary font-medium hover:underline">
              Se connecter
            </NuxtLink>
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
