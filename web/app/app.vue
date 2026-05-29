<script setup>
const { loggedIn, user, clear } = useUserSession()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'Trocdeal — Petites annonces en ligne'
const description = 'Trocdeal : achetez et vendez des objets et services près de chez vous. Petites annonces gratuites entre particuliers.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const navItems = [
  { label: 'Accueil', to: '/', icon: 'i-lucide-home' },
  { label: 'Annonces', to: '/annonces', icon: 'i-lucide-search' }
]

const userMenuItems = computed(() => [
  [{
    label: user.value?.name || 'Mon compte',
    icon: 'i-lucide-user',
    to: '/mon-compte'
  }],
  [
    { label: 'Mes annonces', icon: 'i-lucide-package', to: '/mon-compte/mes-annonces' },
    { label: 'Mes favoris', icon: 'i-lucide-heart', to: '/mon-compte/favoris' },
    { label: 'Messages', icon: 'i-lucide-message-circle', to: '/mon-compte/messages' }
  ],
  [{
    label: 'Déconnexion',
    icon: 'i-lucide-log-out',
    click: async () => {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clear()
      navigateTo('/')
    }
  }]
])
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <UIcon name="i-lucide-repeat-2" class="text-white text-lg" />
          </div>
          <span class="font-bold text-xl tracking-tight hidden sm:inline">Trocdeal</span>
        </NuxtLink>

        <UNavigationMenu :items="navItems" class="ml-6 hidden md:flex" />
      </template>

      <template #right>
        <UButton
          v-if="loggedIn"
          to="/annonces/nouvelle"
          icon="i-lucide-plus"
          label="Déposer une annonce"
          size="sm"
          class="hidden sm:flex"
        />
        <UButton
          v-if="loggedIn"
          to="/annonces/nouvelle"
          icon="i-lucide-plus"
          size="sm"
          class="sm:hidden"
          aria-label="Déposer une annonce"
        />

        <UColorModeButton />

        <template v-if="loggedIn">
          <UButton
            to="/mon-compte/messages"
            icon="i-lucide-message-circle"
            color="neutral"
            variant="ghost"
            aria-label="Messages"
          />

          <UDropdownMenu :items="userMenuItems">
            <UButton
              color="neutral"
              variant="ghost"
              :label="user?.name"
              icon="i-lucide-user"
              class="hidden sm:flex"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-user"
              class="sm:hidden"
              aria-label="Menu utilisateur"
            />
          </UDropdownMenu>
        </template>

        <template v-else>
          <UButton
            to="/auth/connexion"
            variant="ghost"
            color="neutral"
            label="Connexion"
            icon="i-lucide-log-in"
          />
          <UButton
            to="/auth/inscription"
            label="Inscription"
            icon="i-lucide-user-plus"
            size="sm"
          />
        </template>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Trocdeal — Petites annonces en ligne • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            to="/annonces"
            variant="ghost"
            color="neutral"
            label="Parcourir"
            size="xs"
          />
          <UButton
            v-if="!loggedIn"
            to="/auth/inscription"
            variant="ghost"
            color="neutral"
            label="S'inscrire"
            size="xs"
          />
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
