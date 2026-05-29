<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Messages — Trocdeal' })

const route = useRoute()

const { data: conversations, refresh: refreshConversations } = await useFetch('/api/conversations')

const activeConversationId = ref((route.query.conversation as string) || '')
const activeConversation = ref<Record<string, unknown> | null>(null)
const loadingConversation = ref(false)

// Auto-select first conversation if none specified
watch(conversations, (val) => {
  if (val?.length && !activeConversationId.value) {
    selectConversation(val[0].id)
  }
}, { immediate: true })

async function selectConversation(id: string) {
  activeConversationId.value = id
  loadingConversation.value = true
  try {
    activeConversation.value = await $fetch(`/api/conversations/${id}`)
  } catch (e) {
    console.error(e)
  } finally {
    loadingConversation.value = false
  }
}

async function handleMessageSent() {
  // Refresh conversation messages
  if (activeConversationId.value) {
    activeConversation.value = await $fetch(`/api/conversations/${activeConversationId.value}`)
  }
  await refreshConversations()
}

// Handle URL query param
watch(() => route.query.conversation, (id) => {
  if (id && typeof id === 'string') {
    selectConversation(id)
  }
}, { immediate: true })
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
    <h1 class="text-3xl font-bold mb-2">Messages</h1>
    <p class="text-muted mb-4">Vos conversations avec les vendeurs et acheteurs</p>

    <!-- Navigation tabs -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <UButton to="/mon-compte" variant="ghost" icon="i-lucide-user" label="Profil" />
      <UButton to="/mon-compte/mes-annonces" variant="ghost" icon="i-lucide-package" label="Mes annonces" />
      <UButton to="/mon-compte/favoris" variant="ghost" icon="i-lucide-heart" label="Favoris" />
      <UButton to="/mon-compte/messages" variant="soft" icon="i-lucide-message-circle" label="Messages" />
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div class="grid grid-cols-1 md:grid-cols-3 h-[50vh] overflow-hidden">
        <!-- Conversation list -->
        <div class="md:col-span-1 border-r border-gray-200 dark:border-gray-700 overflow-y-auto min-h-0">
          <ConversationList
            :conversations="conversations || []"
            :active-id="activeConversationId"
            @select="selectConversation"
          />
        </div>

        <!-- Chat window -->
        <div class="md:col-span-2 min-h-0 overflow-hidden">
          <template v-if="loadingConversation">
            <div class="h-full flex items-center justify-center">
              <UIcon name="i-lucide-loader-2" class="text-3xl text-muted animate-spin" />
            </div>
          </template>

          <template v-else-if="activeConversation">
            <ChatWindow
              :conversation="activeConversation as any"
              @message-sent="handleMessageSent"
            />
          </template>

          <template v-else>
            <div class="h-full flex flex-col items-center justify-center text-center p-8">
              <UIcon name="i-lucide-message-circle" class="text-5xl text-muted mb-4" />
              <h3 class="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
              <p class="text-muted">Choisissez une conversation dans la liste pour commencer à discuter</p>
            </div>
          </template>
        </div>
      </div>
    </UCard>
  </div>
</template>
