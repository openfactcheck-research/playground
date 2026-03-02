import { ref } from 'vue'

export function useBlockTooltip() {
  const blockTooltipVisible = ref(false)
  const blockTooltipText = ref('')
  const blockTooltipX = ref(0)
  const blockTooltipY = ref(0)

  function setupTooltipObserver(): () => void {
    const nativeTooltipDiv = document.querySelector('.blocklyTooltipDiv') as HTMLElement | null
    if (!nativeTooltipDiv) {
      return () => {}
    }

    nativeTooltipDiv.style.setProperty('opacity', '0', 'important')

    const observer = new MutationObserver(() => {
      const text = nativeTooltipDiv.textContent?.trim() ?? ''
      const isVisible = nativeTooltipDiv.style.display !== 'none' && text !== ''
      if (isVisible) {
        blockTooltipText.value = text
        blockTooltipX.value = Number.parseFloat(nativeTooltipDiv.style.left) || 0
        blockTooltipY.value = Number.parseFloat(nativeTooltipDiv.style.top) || 0
        blockTooltipVisible.value = true
      }
      else {
        blockTooltipVisible.value = false
      }
    })

    observer.observe(nativeTooltipDiv, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => observer.disconnect()
  }

  return {
    blockTooltipVisible,
    blockTooltipText,
    blockTooltipX,
    blockTooltipY,
    setupTooltipObserver,
  }
}
