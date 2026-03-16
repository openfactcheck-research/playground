// ---------------------------------------------------------------------------
// FieldButton — a clickable pill button rendered inside a Blockly block.
// Extends FieldTextInput so the row height is automatically identical to
// other text-input rows (borderRect height comes from shared constants).
// ---------------------------------------------------------------------------

import * as Blockly from 'blockly/core'

const PADDING_X = 7
const ICON_SIZE = 10
const ICON_GAP = 4
const CORNER_RADIUS = 3
const SCALE = ICON_SIZE / 24

export class FieldButton extends Blockly.FieldTextInput {
  private readonly label_: string
  private readonly onClick_: () => void
  private readonly iconPath_: string | null
  private iconGroup_: SVGGElement | null = null
  private labelEl_: SVGTextElement | null = null

  constructor(label: string, onClick: () => void, iconPath?: string) {
    super('')
    this.label_ = label
    this.onClick_ = onClick
    this.iconPath_ = iconPath ?? null
    this.SERIALIZABLE = false
  }

  override initView(): void {
    // super creates borderRect_ (gives us the correct row height) and textElement_
    super.initView()

    // Hide the native text element — we draw our own label
    if (this.textElement_)
      this.textElement_.setAttribute('display', 'none')

    // Style borderRect_ as a dark button pill
    if (this.borderRect_) {
      this.borderRect_.setAttribute('rx', String(CORNER_RADIUS))
      this.borderRect_.setAttribute('ry', String(CORNER_RADIUS))
      this.borderRect_.setAttribute('fill', 'rgba(0,0,0,0.28)')
      this.borderRect_.setAttribute('stroke', 'rgba(255,255,255,0.18)')
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
        {
          'd': this.iconPath_,
          // Keep stroke width constant regardless of the scale() transform
          'vector-effect': 'non-scaling-stroke',
        },
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

  // Click handler — called by Blockly when the field is activated
  protected override showEditor_(): void {
    if (this.borderRect_)
      this.borderRect_.setAttribute('fill', 'rgba(0,0,0,0.50)')
    setTimeout(() => this.borderRect_?.setAttribute('fill', 'rgba(0,0,0,0.28)'), 150)
    this.onClick_()
  }

  protected override updateSize_(margin?: number): void {
    // Call super to get the correct borderRect height from FieldTextInput constants
    super.updateSize_(margin)
    const h = this.size_.height

    const labelW = this.labelEl_?.getComputedTextLength() ?? (this.label_.length * 6)
    const iconW = this.iconPath_ ? ICON_SIZE + ICON_GAP : 0
    const w = iconW + labelW + PADDING_X * 2
    this.size_.width = w

    if (this.borderRect_)
      this.borderRect_.setAttribute('width', String(w))

    if (this.iconGroup_) {
      const iconY = h / 2 - ICON_SIZE / 2
      this.iconGroup_.setAttribute(
        'transform',
        `translate(${PADDING_X}, ${iconY}) scale(${SCALE})`,
      )
    }

    if (this.labelEl_) {
      this.labelEl_.setAttribute('x', String(PADDING_X + iconW))
      this.labelEl_.setAttribute('y', String(h / 2))
    }
  }

  override toXml(fieldElement: Element): Element { return fieldElement }
  override fromXml(): void {}
  override saveState(): null { return null }
  override loadState(): void {}
}
