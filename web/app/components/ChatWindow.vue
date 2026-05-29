<script setup lang="ts">
const props = defineProps<{
  conversation: {
    id: string
    otherUser: { id: string; name: string }
    listing: { id: string; title: string; price: number; images: { url: string }[] }
    messages: Array<{
      id: string
      content: string
      createdAt: string
      sender: { id: string; name: string }
    }>
  }
}>()

const emit = defineEmits<{
  messageSent: []
}>()

const { user } = useUserSession()
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref<HTMLElement>()

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return

  sending.value = true
  try {
    await $fetch('/api/messages', {
      method: 'POST',
      body: {
        conversationId: props.conversation.id,
        content: newMessage.value.trim()
      }
    })
    newMessage.value = ''
    emit('messageSent')
  } catch (e) {
    console.error('Erreur envoi message:', e)
  } finally {
    sending.value = false
  }
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Group messages by date
const groupedMessages = computed(() => {
  const groups: { date: string; messages: typeof props.conversation.messages }[] = []
  let currentDate = ''

  for (const msg of props.conversation.messages) {
    const date = new Date(msg.createdAt).toDateString()
    if (date !== currentDate) {
      currentDate = date
      groups.push({ date: msg.createdAt, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }

  return groups
})

onMounted(scrollToBottom)
watch(() => props.conversation.messages.length, scrollToBottom)
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shrink-0">
      <NuxtLink :to="`/annonces/${conversation.listing.id}`" class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
          <img
            v-if="conversation.listing.images?.[0]?.url"
            :src="conversation.listing.images[0].url"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-sm truncate">{{ conversation.otherUser.name }}</p>
          <p class="text-xs text-muted truncate">{{ conversation.listing.title }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 chat-messages"
    >
      <div v-for="group in groupedMessages" :key="group.date">
        <div class="flex items-center justify-center my-4">
          <span class="text-xs text-muted bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {{ formatDate(group.date) }}
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="msg in group.messages"
            :key="msg.id"
            class="flex"
            :class="msg.sender.id === user?.id ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] px-4 py-2 rounded-2xl text-sm"
              :class="msg.sender.id === user?.id
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'"
            >
              <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
              <p
                class="text-xs mt-1 opacity-70"
                :class="msg.sender.id === user?.id ? 'text-right' : ''"
              >
                {{ formatTime(msg.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
      <form @submit.prevent="sendMessage" class="flex items-end gap-2">
        <UTextarea
          v-model="newMessage"
          placeholder="Écrire un message..."
          :rows="1"
          autoresize
          :maxrows="4"
          class="flex-1"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <UButton
          type="submit"
          icon="i-lucide-send"
          :loading="sending"
          :disabled="!newMessage.trim()"
          aria-label="Envoyer"
        />
      </form>
    </div>
  </div>
</template>
