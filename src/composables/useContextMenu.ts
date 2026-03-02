import type { ContextMenuItem } from '@/components/workspace/ContextMenu.vue'
import { ref } from 'vue'

export function useContextMenu() {
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)
  const contextMenuItems = ref<ContextMenuItem[]>([])

  function closeContextMenu(): void {
    contextMenuVisible.value = false
  }

  function showCustomContextMenu(menuOpenEvent: Event, options: any[]): void {
    const mouseEvent = menuOpenEvent as MouseEvent
    contextMenuX.value = mouseEvent.clientX
    contextMenuY.value = mouseEvent.clientY

    // Convert Blockly options to our format, inserting separators between groups
    const items: ContextMenuItem[] = []
    let lastWeight = -Infinity
    for (const opt of options) {
      if (opt.separator) {
        items.push({ text: '', enabled: false, separator: true, callback: () => {} })
        continue
      }
      // Insert separator between weight groups (gaps > 1)
      const weight = opt.weight ?? 0
      if (items.length > 0 && !items[items.length - 1]?.separator && weight - lastWeight > 1) {
        items.push({ text: '', enabled: false, separator: true, callback: () => {} })
      }
      lastWeight = weight

      const text = typeof opt.text === 'string' ? opt.text : opt.text?.textContent ?? 'Action'
      items.push({
        text,
        enabled: opt.enabled !== false,
        callback: () => {
          if (opt.callback) {
            // Registry callbacks expect (scope, event)
            opt.callback(opt.scope, menuOpenEvent)
          }
        },
      })
    }
    contextMenuItems.value = items
    contextMenuVisible.value = true
  }

  return {
    contextMenuVisible,
    contextMenuX,
    contextMenuY,
    contextMenuItems,
    showCustomContextMenu,
    closeContextMenu,
  }
}
