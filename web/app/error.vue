<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: {
    type: Object as () => NuxtError,
    required: true
  }
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <div class="fixed inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-900 z-50">
      <UIcon
        :name="error.statusCode === 404 ? 'i-lucide-search-x' : 'i-lucide-alert-triangle'"
        class="text-6xl text-muted mb-6"
      />
      <h1 class="text-4xl font-bold mb-2">
        {{ error.statusCode === 404 ? 'Page introuvable' : 'Une erreur est survenue' }}
      </h1>
      <p class="text-lg text-muted mb-8 max-w-md mx-auto">
        {{ error.statusCode === 404
          ? "L'annonce ou la page que vous cherchez n'existe pas ou n'est plus disponible."
          : error.message || "Nous rencontrons un problème technique. Veuillez réessayer plus tard." }}
      </p>
      
      <div class="flex gap-4">
        <UButton
          size="xl"
          icon="i-lucide-home"
          label="Retour à l'accueil"
          @click="handleError"
        />
      </div>
    </div>
  </UApp>
</template>
