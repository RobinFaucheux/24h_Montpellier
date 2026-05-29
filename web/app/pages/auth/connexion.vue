<script setup lang="ts">
useSeoMeta({ title: 'Connexion — ScamMarket' })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  errorMsg.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    await refreshSession()

    const redirect = (route.query.redirect as string) || '/'
    navigateTo(redirect)
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    errorMsg.value = error.data?.message || 'Erreur de connexion'
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
          <UIcon name="i-lucide-repeat-2" class="text-white text-3xl" />
        </div>
        <h1 class="text-2xl font-bold">Connexion</h1>
        <p class="text-muted mt-2">Connectez-vous à votre compte ScamMarket</p>
      </div>

      <UCard>
        <form @submit.prevent="login" class="space-y-4">
          <UAlert v-if="errorMsg" icon="i-lucide-alert-circle" :title="errorMsg" color="error" />

          <UFormField label="Email">
            <UInput
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
              style="width: 100%;"
              required
              autofocus
            />
          </UFormField>

          <UFormField label="Mot de passe">
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
              style="width: 100%;"
              required
            />
          </UFormField>

          <UButton
            type="submit"
            block
            size="lg"
            icon="i-lucide-log-in"
            label="Se connecter"
            :loading="loading"
          />
        </form>

        <template #footer>
          <p class="text-center text-sm text-muted">
            Pas encore de compte ?
            <NuxtLink to="/auth/inscription" class="text-primary font-medium hover:underline">
              Créer un compte
            </NuxtLink>
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
