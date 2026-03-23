import * as Blockly from 'blockly/core'

export class FieldPasswordInput extends Blockly.FieldTextInput {
  // Show bullets instead of the actual value
  override getDisplayText_(): string {
    const val = this.getValue() ?? ''
    return val.length > 0 ? '•'.repeat(Math.min(val.length, 16)) : ''
  }

  // Set input type to password when the editor opens
  override showEditor_(e?: Event): void {
    super.showEditor_(e)
    const input = document.querySelector('.blocklyHtmlInput') as HTMLInputElement | null
    if (input)
      input.type = 'password'
  }
}
