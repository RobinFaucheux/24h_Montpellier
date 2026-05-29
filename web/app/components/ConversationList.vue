<script setup lang="ts">
defineProps<{
  conversations: Array<{
    id: string
    otherUser: { id: string; name: string }
    listing: { id: string; title: string; price: number; images: { url: string }[] }
    lastMessage: { content: string; createdAt: string; senderId: string } | null
    unreadCount: number
  }>
  activeId?: string
}>()

defineEmits<{
  select: [id: string]
}>()

function formatTime(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (hours < 1) return 'maintenant'
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="divide-y divide-gray-100 dark:divide-gray-800">
    <button
      v-for="conv in conversations"
      :key="conv.id"
      class="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      :class="activeId === conv.id && 'bg-primary/5'"
      @click="$emit('select', conv.id)"
    >
      <!-- Listing image -->
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        <img
          v-if="conv.listing.images?.[0]?.url"
          :src="conv.listing.images[0].url"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon name="i-lucide-image" class="text-muted" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm truncate" :class="conv.unreadCount > 0 && 'text-primary'">
            {{ conv.otherUser.name }}
          </span>
          <span v-if="conv.lastMessage" class="text-xs text-muted shrink-0">
            {{ formatTime(conv.lastMessage.createdAt) }}
          </span>
        </div>
        <p class="text-xs text-muted truncate mt-0.5">{{ conv.listing.title }}</p>
        <p
          v-if="conv.lastMessage"
          class="text-sm truncate mt-1"
          :class="conv.unreadCount > 0 ? 'font-medium' : 'text-muted'"
        >
          {{ conv.lastMessage.content }}
        </p>
      </div>

      <!-- Unread badge -->
      <UBadge
        v-if="conv.unreadCount > 0"
        :label="String(conv.unreadCount)"
        size="xs"
        class="shrink-0 mt-1"
      />
    </button>

    <div v-if="!conversations.length" class="p-8 text-center">
      <UIcon name="i-lucide-message-circle" class="text-4xl text-muted mb-2" />
      <p class="text-muted text-sm">Aucune conversation</p>
    </div>
  </div>
</template>
