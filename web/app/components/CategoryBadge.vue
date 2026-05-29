<script setup lang="ts">
defineProps<{
  category: {
    name: string
    slug: string
    icon: string
  }
  active?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-md min-w-[100px]"
    :class="active
      ? 'border-primary bg-primary/5 text-primary shadow-sm'
      : 'border-gray-200 dark:border-gray-700 hover:border-primary/30 text-muted hover:text-foreground'"
    @click="$emit('click')"
  >
    <UIcon :name="category.icon" class="text-2xl" />
    <span class="text-xs font-medium text-center leading-tight">{{ category.name }}</span>
  </button>
</template>
