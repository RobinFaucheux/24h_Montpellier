const STORAGE_KEY = 'recently-viewed-listings'
const MAX_HISTORY = 20

function normalizeIds(ids: string[]) {
  return Array.from(
    new Set(
      ids
        .map(id => id.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_HISTORY)
}

export function useRecentlyViewedListings() {
  const ids = useState<string[]>('recently-viewed-listings', () => [])
  const ready = ref(false)

  function readFromStorage() {
    if (!import.meta.client) return []

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return []

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      return normalizeIds(parsed.filter((id): id is string => typeof id === 'string'))
    } catch {
      return []
    }
  }

  function writeToStorage(nextIds: string[]) {
    if (!import.meta.client) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds))
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }

  function syncFromStorage() {
    ids.value = readFromStorage()
    ready.value = true
  }

  function recordViewedListing(listingId: string) {
    const normalizedId = listingId.trim()
    if (!normalizedId) return

    const currentIds = import.meta.client ? readFromStorage() : ids.value

    const nextIds = normalizeIds([
      normalizedId,
      ...currentIds.filter(id => id !== normalizedId)
    ])

    ids.value = nextIds
    writeToStorage(nextIds)
  }

  function clearRecentlyViewedListings() {
    ids.value = []
    writeToStorage([])
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return
    syncFromStorage()
  }

  if (import.meta.client) {
    onMounted(() => {
      syncFromStorage()
      window.addEventListener('storage', handleStorage)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('storage', handleStorage)
    })
  }

  return {
    ids,
    ready,
    recordViewedListing,
    clearRecentlyViewedListings,
    syncFromStorage
  }
}
