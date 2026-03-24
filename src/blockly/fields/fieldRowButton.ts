// ---------------------------------------------------------------------------
// FieldRowButton — a full-width clickable button that spans an entire block row.
// Pass the same fixedWidth as the block's BLOCK_WIDTH so it fills the row edge-to-edge.
// ---------------------------------------------------------------------------

import * as Blockly from 'blockly/core'

const ICON_SIZE = 10
const ICON_GAP = 5
const CORNER_RADIUS = 4
const SCALE = ICON_SIZE / 24

export class FieldRowButton extends Blockly.FieldTextInput {
  private readonly label_: string
  private readonly onClick_: () => void
  private readonly iconPath_: string | null
  private readonly fixedWidth_: number
  private iconGroup_: SVGGElement | null = null
  private labelEl_: SVGTextElement | null = null

  constructor(label: string, onClick: () => void, fixedWidth: number, iconPath?: string) {
    super('')
    this.label_ = label
    this.onClick_ = onClick
    this.fixedWidth_ = fixedWidth
    this.iconPath_ = iconPath ?? null
    this.SERIALIZABLE = false
  }

  override initView(): void {
    super.initView()

    if (this.textElement_)
      this.textElement_.setAttribute('display', 'none')

    if (this.borderRect_) {
      this.borderRect_.setAttribute('rx', String(CORNER_RADIUS))
      this.borderRect_.setAttribute('ry', String(CORNER_RADIUS))
      this.borderRect_.setAttribute('fill', 'rgba(0,0,0,0.22)')
      this.borderRect_.setAttribute('stroke', 'rgba(255,255,255,0.12)')
      this.borderRect_.setAttribute('stroke-width', '1')
    }

    if (this.fieldGroup_)
      (this.fieldGroup_ as SVGElement).style.cursor = 'pointer'

    if (this.iconPath_) {
      this.iconGroup_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.G,
        {
          'fill': 'none',
          'stroke': '#000000',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        this.fieldGroup_,
      ) as SVGGElement
      Blockly.utils.dom.createSvgElement(
        'path' as any,
        { 'd': this.iconPath_, 'vector-effect': 'non-scaling-stroke' },
        this.iconGroup_,
      )
    }

    this.labelEl_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.TEXT,
      {
        'dominant-baseline': 'middle',
        'text-anchor': 'start',
        'fill': '#000000',
        'font-family': 'sans-serif',
        'font-size': '10px',
        'font-weight': '500',
        'pointer-events': 'none',
      },
      this.fieldGroup_,
    ) as SVGTextElement
    this.labelEl_.textContent = this.label_
  }

  protected override showEditor_(): void {
    if (this.borderRect_)
      this.borderRect_.setAttribute('fill', 'rgba(0,0,0,0.40)')
    setTimeout(() => this.borderRect_?.setAttribute('fill', 'rgba(0,0,0,0.22)'), 150)
    this.onClick_()
  }

  protected override updateSize_(margin?: number): void {
    super.updateSize_(margin)
    const h = this.size_.height
    const w = this.fixedWidth_

    this.size_.width = w

    if (this.borderRect_) {
      this.borderRect_.setAttribute('width', String(w))
    }

    const iconW = this.iconPath_ ? ICON_SIZE + ICON_GAP : 0
    const contentW = iconW + (this.labelEl_?.getComputedTextLength() ?? this.label_.length * 6)
    const startX = (w - contentW) / 2

    if (this.iconGroup_) {
      const iconY = h / 2 - ICON_SIZE / 2
      this.iconGroup_.setAttribute(
        'transform',
        `translate(${startX}, ${iconY}) scale(${SCALE})`,
      )
    }

    if (this.labelEl_) {
      this.labelEl_.setAttribute('x', String(startX + iconW))
      this.labelEl_.setAttribute('y', String(h / 2))
    }
  }

  override toXml(fieldElement: Element): Element { return fieldElement }
  override fromXml(): void {}
  override saveState(): null { return null }
  override loadState(): void {}
}
