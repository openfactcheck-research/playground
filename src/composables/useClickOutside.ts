import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'

export function useClickOutside(elementRef: Ref<HTMLElement | null>, callback: () => void): void {
  function handler(event: MouseEvent): void {
    if (elementRef.value && !elementRef.value.contains(event.target as Node))
      callback()
  }

  onMounted(() => document.addEventListener('click', handler))
  onUnmounted(() => document.removeEventListener('click', handler))
}
