import * as Blockly from 'blockly/core'

/**
 * A serializable field that renders nothing on the block.
 * Use it to persist arbitrary string data (e.g. JSON) on a block
 * while triggering BLOCK_CHANGE events via setFieldValue().
 */
export class FieldHidden extends Blockly.Field<string> {
  SERIALIZABLE = true

  constructor(value = '') {
    super(value)
  }

  // No DOM — zero size, nothing to render.
  override initView(): void {}
  override updateSize_(): void {
    this.size_ = new Blockly.utils.Size(0, 0)
  }

  override getDisplayText_(): string {
    return ''
  }
}
