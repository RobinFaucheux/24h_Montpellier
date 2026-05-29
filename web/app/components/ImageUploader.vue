<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
  max?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploading = ref(false)

const maxFiles = props.max || 5

function openPicker() {
  fileInput.value?.click()
}

async function handleFiles(files: FileList | null) {
  if (!files?.length) return

  const currentCount = props.modelValue.length
  const remaining = maxFiles - currentCount
  if (remaining <= 0) return

  const toUpload = Array.from(files).slice(0, remaining)

  uploading.value = true
  try {
    const formData = new FormData()
    for (const file of toUpload) {
      formData.append('file', file)
    }

    const result = await $fetch<{ urls: string[] }>('/api/upload', {
      method: 'POST',
      body: formData
    })

    emit('update:modelValue', [...props.modelValue, ...result.urls])
  } catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    console.error('Upload error:', error.data?.message || 'Erreur upload')
  } finally {
    uploading.value = false
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  handleFiles(e.dataTransfer?.files || null)
}

function removeImage(index: number) {
  const newUrls = [...props.modelValue]
  newUrls.splice(index, 1)
  emit('update:modelValue', newUrls)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Image previews -->
    <div v-if="modelValue.length" class="flex flex-wrap gap-3">
      <div
        v-for="(url, index) in modelValue"
        :key="url"
        class="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <img :src="url" class="w-full h-full object-cover" />
        <button
          class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          @click="removeImage(index)"
        >
          <UIcon name="i-lucide-trash-2" class="text-white text-lg" />
        </button>
        <span class="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-xs px-1 rounded">
          {{ index + 1 }}
        </span>
      </div>
    </div>

    <!-- Drop zone -->
    <div
      v-if="modelValue.length < maxFiles"
      class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
      :class="isDragging
        ? 'border-primary bg-primary/5'
        : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'"
      @click="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <UIcon
        :name="uploading ? 'i-lucide-loader-2' : 'i-lucide-image-plus'"
        class="text-3xl text-muted mb-2"
        :class="uploading && 'animate-spin'"
      />
      <p class="text-sm font-medium">
        {{ uploading ? 'Envoi en cours...' : 'Glissez vos photos ici ou cliquez pour sélectionner' }}
      </p>
      <p class="text-xs text-muted mt-1">
        {{ modelValue.length }}/{{ maxFiles }} photos • JPG, PNG, WebP • 5 Mo max
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />
  </div>
</template>
