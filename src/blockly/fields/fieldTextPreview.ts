// ---------------------------------------------------------------------------
// FieldTextPreview — stores full text, displays truncated at fixed width.
// Direct block editing and PanelControls editing are both supported.
// ---------------------------------------------------------------------------

import * as Blockly from 'blockly/core'

const H_PADDING = 16 // horizontal padding inside the field

export class FieldTextPreview extends Blockly.FieldTextInput {
  private readonly fixedWidth_: number

  constructor(value: string, fixedWidth: number) {
    super(value)
    this.fixedWidth_ = fixedWidth
  }

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin)

    // Pixel-precise truncation: shorten text until it fits within fixedWidth_
    if (this.textElement_) {
      const available = this.fixedWidth_ - H_PADDING
      let text = this.getValue() ?? ''
      this.textElement_.textContent = text
      while (text.length > 0 && this.textElement_.getComputedTextLength() > available) {
        // Strip last char (before trailing ellipsis if present) and re-add ellipsis
        const base = text.endsWith('…') ? text.slice(0, -2) : text.slice(0, -1)
        text = base.length > 0 ? `${base}…` : ''
        this.textElement_.textContent = text
      }
    }

    this.size_.width = this.fixedWidth_
    if (this.borderRect_)
      this.borderRect_.setAttribute('width', String(this.fixedWidth_))
  }
}
