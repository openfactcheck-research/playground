import { ref } from 'vue'

export const promptOpen = ref(false)
export const promptMessage = ref('')
export const promptDefault = ref('')

let _callback: ((value: string | null) => void) | null = null

export function openPrompt(message: string, defaultValue: string, callback: (value: string | null) => void): void {
  promptMessage.value = message
  promptDefault.value = defaultValue
  _callback = callback
  promptOpen.value = true
}

export function resolvePrompt(value: string | null): void {
  promptOpen.value = false
  _callback?.(value)
  _callback = null
}
