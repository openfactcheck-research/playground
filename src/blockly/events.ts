/**
 * Blockly custom events for Vue integration
 * Provides a simple event system for blocks to communicate with Vue components
 */

export type PromptExpandEvent = {
  blockId: string
  templateContent: string
}

type EventListener<T> = (data: T) => void

class BlocklyEventBus {
  private listeners: Map<string, Set<EventListener<any>>> = new Map()

  on<T>(event: string, callback: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  off<T>(event: string, callback: EventListener<T>): void {
    this.listeners.get(event)?.delete(callback)
  }
}

export const blocklyEvents = new BlocklyEventBus()

// Event names
export const PROMPT_EXPAND_EVENT = 'prompt:expand'
export const PROMPT_UPDATE_EVENT = 'prompt:update'

export type PromptUpdateEvent = {
  blockId: string
  newContent: string
}
