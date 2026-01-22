import { onMounted, ref, watch } from "vue"
import { useMediaQuery } from "@vueuse/core"

export const useSidebarState = () => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSidebarOpen = ref(true)

  onMounted(() => {
    isSidebarOpen.value = !isMobile.value
  })

  watch(isMobile, (value) => {
    if (value) {
      isSidebarOpen.value = false
    }
  })

  return {
    isSidebarOpen,
  }
}
