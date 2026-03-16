import SAMPLES from '@data/templates/textInputSamples.json'
import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldButton } from '@/blockly/fields/fieldButton'
import { FieldTextPreview } from '@/blockly/fields/fieldTextPreview'

export const BLOCK_TYPE = 'text_input'

const BLOCK_WIDTH = 160

// Lucide 24×24 path data for each button icon
const ICON_REFRESH = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0-5v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 5v-5h5'
const ICON_UPLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'
const ICON_LINK = 'M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6A5 5 0 0 1 6 7h3m-1 5h8'

function addButtonsRow(block: Blockly.Block): void {
  let sampleIndex = 0

  block.appendDummyInput('BUTTONS_ROW')
    .setAlign(Blockly.inputs.Align.RIGHT)
    .appendField(new FieldButton('Sample', () => {
      block.setFieldValue(SAMPLES[sampleIndex]!, 'INPUT_TEXT')
      sampleIndex = (sampleIndex + 1) % SAMPLES.length
    }, ICON_REFRESH))
    .appendField(new FieldButton('Upload', () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.text,text/plain'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file)
          return
        const reader = new FileReader()
        reader.onload = () => block.setFieldValue(reader.result as string, 'INPUT_TEXT')
        reader.readAsText(file)
      }
      input.click()
    }, ICON_UPLOAD))
    .appendField(new FieldButton('URL', () => {
      Blockly.dialog.prompt('Enter a URL to fetch text from:', '', (text) => {
        if (text?.trim())
          block.setFieldValue(text, 'INPUT_TEXT')
      })
    }, ICON_LINK))
}

export function setVerbose(block: Blockly.Block, verbose: boolean): void {
  const hasButtons = !!block.getInput('BUTTONS_ROW')
  if (verbose && !hasButtons) {
    Blockly.Events.disable()
    try {
      addButtonsRow(block)
    }
    finally {
      Blockly.Events.enable()
    }
    ;(block as Blockly.BlockSvg).initSvg()
    ;(block as Blockly.BlockSvg).render()
  }
  else if (!verbose && hasButtons) {
    Blockly.Events.disable()
    try {
      block.removeInput('BUTTONS_ROW', true)
    }
    finally {
      Blockly.Events.enable()
    }
    ;(block as Blockly.BlockSvg).render()
  }
}

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .appendField(new FieldBlockHeader('Input Text', 'M6 2v8 M2 3.5V2.5a0.5 0.5 0 0 1 0.5-0.5h7a0.5 0.5 0 0 1 0.5 0.5v1 M4.5 10h3', BLOCK_WIDTH))

      this.appendDummyInput('INPUT_TEXT_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new FieldTextPreview('Enter your text here...', 192), 'INPUT_TEXT')

      this.setNextStatement(true, null)
      this.setInputsInline(false)
      this.setStyle('io_blocks')
      this.setTooltip('Starting block — type your text directly')
    },
  }

  pythonGenerator.forBlock[BLOCK_TYPE] = function (block: Blockly.Block): string {
    const text = block.getFieldValue('INPUT_TEXT') ?? ''
    const escaped = text.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')
    return `input_text = """${escaped}"""\n`
  }
}
