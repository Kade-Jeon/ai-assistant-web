import { onMounted, ref } from "vue"

const THEME_STORAGE_KEY = "chat-theme"

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark)
}

export const useTheme = () => {
  const isDark = ref(false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
    localStorage.setItem(THEME_STORAGE_KEY, isDark.value ? "dark" : "light")
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    isDark.value = savedTheme === "dark"
    applyTheme(isDark.value)
  })

  return {
    isDark,
    toggleTheme,
  }
}
