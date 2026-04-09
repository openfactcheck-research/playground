import { ref } from 'vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

// Single global observer — watches for external class changes
const observer = new MutationObserver(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

function toggleTheme(): void {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}

export function useTheme() {
  return { isDark, toggleTheme }
}
