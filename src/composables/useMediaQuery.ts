import { onMounted, onUnmounted, ref } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)

  const mediaQuery = window.matchMedia(query)
  const handler = (e: MediaQueryListEvent) => {
    matches.value = e.matches
  }

  onMounted(() => {
    matches.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handler)
  })

  return matches
}
