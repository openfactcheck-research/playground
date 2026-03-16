// ---------------------------------------------------------------------------
// FieldBlockHeader — non-editable header with SVG icon and centered text.
// ---------------------------------------------------------------------------

import * as Blockly from 'blockly/core'

const ICON_SIZE = 12

export class FieldBlockHeader extends Blockly.FieldLabel {
  private iconGroup_: SVGGElement | null = null
  private iconPathEl_: SVGPathElement | null = null
  private readonly iconPathStr_: string
  private readonly fixedWidth_: number

  constructor(text: string, iconPath: string, fixedWidth: number) {
    super(text)
    this.iconPathStr_ = iconPath
    this.fixedWidth_ = fixedWidth
  }

  override initView(): void {
    super.initView()

    this.iconGroup_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      { class: 'ofc-block-header-icon' },
      this.fieldGroup_,
    )

    this.iconPathEl_ = Blockly.utils.dom.createSvgElement('path' as any, {
      'd': this.iconPathStr_,
      'fill': 'none',
      'stroke': '#555555',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, this.iconGroup_) as unknown as SVGPathElement
  }

  override applyColour(): void {
    super.applyColour()
    if (!this.iconPathEl_)
      return
    this.iconPathEl_.setAttribute('stroke', 'rgba(255,255,255,0.85)')
  }

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin)
    this.size_.width = this.fixedWidth_
    if (this.borderRect_) {
      this.borderRect_.setAttribute('width', String(this.fixedWidth_))
    }
  }

  protected override positionTextElement_(xOffset: number, contentWidth: number): void {
    const iconSpace = ICON_SIZE + 14 // icon width + gap
    super.positionTextElement_(xOffset + iconSpace, contentWidth)
    if (this.iconGroup_) {
      const iconX = xOffset + 4
      const iconY = (this.size_.height - ICON_SIZE) / 2
      this.iconGroup_.setAttribute('transform', `translate(${iconX}, ${iconY})`)
    }
  }
}
