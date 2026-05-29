<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
}>()

const searchQuery = ref(props.modelValue || '')

function handleSearch() {
  emit('update:modelValue', searchQuery.value)
  emit('search', searchQuery.value)
}
</script>

<template>
  <form @submit.prevent="handleSearch" class="flex gap-2 w-full">
    <UInput
      v-model="searchQuery"
      :placeholder="placeholder || 'Rechercher une annonce...'"
      icon="i-lucide-search"
      size="lg"
      class="flex-1"
      @keyup.enter="handleSearch"
    />
    <UButton
      type="submit"
      label="Rechercher"
      icon="i-lucide-search"
      size="lg"
      class="hidden sm:flex"
    />
    <UButton
      type="submit"
      icon="i-lucide-search"
      size="lg"
      class="sm:hidden"
      aria-label="Rechercher"
    />
  </form>
</template>
