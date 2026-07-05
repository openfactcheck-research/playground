import * as Blockly from 'blockly/core'
import { customAlphabet } from 'nanoid'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldTextPreview } from '@/blockly/fields/fieldTextPreview'

export const BLOCK_TYPE = 'prompt_template'

// Mutator sub-blocks: the container that holds the message stack, and one
// clause block per role. Not added to the toolbox; they live only in the
// mutator flyout.
const CONTAINER_TYPE = 'prompt_template_container'

const BLOCK_WIDTH = 160
const ROW_WIDTH = 193 // content row width, matches FieldTextPreview width used across blocks

// Lucide "file-text" icon scaled to 12×12
const ICON_FILE_TEXT
  = 'M7 1H3.5A1.5 1.5 0 0 0 2 2.5v7A1.5 1.5 0 0 0 3.5 11h5A1.5 1.5 0 0 0 10 9.5V4L7 1z M7 1v3h3 M8 6.5H4 M8 8.5H4 M5 4.5H4'

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type Role = 'system' | 'user' | 'assistant'

const ROLES: readonly Role[] = ['system', 'user', 'assistant']
const CLAUSE_TYPE: Record<Role, string> = {
  system: 'prompt_message_system',
  user: 'prompt_message_user',
  assistant: 'prompt_message_assistant',
}
const ROLE_BY_CLAUSE: Record<string, Role> = {
  prompt_message_system: 'system',
  prompt_message_user: 'user',
  prompt_message_assistant: 'assistant',
}
const ROLE_LABEL: Record<Role, string> = { system: 'System', user: 'User', assistant: 'Assistant' }
const ROLE_PLACEHOLDER: Record<Role, string> = {
  system: 'System prompt, with {{vars}}...',
  user: 'User prompt, with {{vars}}...',
  assistant: 'Assistant message, with {{vars}}...',
}

// A message turn's structure. The turn's text is not stored here; it lives in
// the block's `TEXT_<id>` field so the field is the single source of content.
type Turn = { id: string, role: Role }

// Short, field-name-safe ids (letters/digits only) for each turn's row.
const nextTurnId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

const textField = (id: string): string => `TEXT_${id}`
const rowInput = (id: string): string => `MSG_${id}`

// FieldTextPreview that skips Blockly's auto-serialization: row field names are
// per-session ids that would not match on reload, so message content is saved
// and restored through saveExtraState/loadExtraState instead.
class DeferredTextPreview extends FieldTextPreview {
  override saveState(): null {
    return null
  }
}

// The block instance, augmented with the mutator state and helpers it carries.
type PromptTemplateBlock = Blockly.BlockSvg & {
  turns_: Turn[]
  rebuildRows_: () => void
  setTurns_: (turns: Turn[], contentById: Record<string, string>) => void
  updateWarning_: () => void
}

// ---------------------------------------------------------------------------
// Helpers (read by the generator, the agent block, and the controls panel)
// ---------------------------------------------------------------------------

// The template's messages in order, each role paired with its current text.
export function templateMessages(block: Blockly.Block): Array<{ role: Role, content: string }> {
  const turns = (block as PromptTemplateBlock).turns_ ?? []
  return turns.map(t => ({ role: t.role, content: block.getFieldValue(textField(t.id)) ?? '' }))
}

// The rows the controls panel edits: a stable id, the role, and the field to
// read from and write to.
export function templateRows(block: Blockly.Block): Array<{ id: string, role: Role, field: string }> {
  const turns = (block as PromptTemplateBlock).turns_ ?? []
  return turns.map(t => ({ id: t.id, role: t.role, field: textField(t.id) }))
}

// Variables referenced across every message body, in first-seen order. Any body
// may carry {{placeholders}}; the union is the template's variable contract.
export function templateVariables(block: Blockly.Block): string[] {
  const text = templateMessages(block).map(m => m.content).join('\n')
  const vars: string[] = []
  for (const match of text.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!vars.includes(match[1]!))
      vars.push(match[1]!)
  }
  return vars
}

// ---------------------------------------------------------------------------
// Block definition
// ---------------------------------------------------------------------------

function registerMutatorBlocks(): void {
  // Container: the root of the mutator workspace, holding the message stack.
  Blockly.Blocks[CONTAINER_TYPE] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('Messages')
      this.appendStatementInput('STACK')
      this.setStyle('prompt_blocks')
      this.setTooltip('Add, remove, and reorder the template\'s messages')
      this.contextMenu = false
    },
  }

  // One clause block per role; stackable inside the container.
  for (const role of ROLES) {
    Blockly.Blocks[CLAUSE_TYPE[role]] = {
      init(this: Blockly.Block) {
        this.appendDummyInput().appendField(ROLE_LABEL[role])
        this.setPreviousStatement(true)
        this.setNextStatement(true)
        this.setStyle('prompt_blocks')
        this.setTooltip(`A ${ROLE_LABEL[role]} message`)
        this.contextMenu = false
      },
    }
  }
}

export function register(): void {
  registerMutatorBlocks()

  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: PromptTemplateBlock) {
      this.appendDummyInput('HEADER')
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField(new FieldBlockHeader('Prompt Template', ICON_FILE_TEXT, BLOCK_WIDTH))

      this.setStyle('prompt_blocks')
      // Previous connection only, no next: exactly one prompt template may sit
      // in the Agent's Prompt slot, so templates cannot be chained in series.
      this.setPreviousStatement(true, 'PromptTemplate')

      // Default to a system + user pair, matching a plain single-turn prompt.
      this.turns_ = [
        { id: nextTurnId(), role: 'system' },
        { id: nextTurnId(), role: 'user' },
      ]
      this.rebuildRows_()

      this.setMutator(
        new Blockly.icons.MutatorIcon(
          [CLAUSE_TYPE.system, CLAUSE_TYPE.user, CLAUSE_TYPE.assistant],
          this,
        ),
      )
    },

    // Rebuild the message rows from `turns_`. Content is restored separately by
    // the caller via `setFieldValue`, so freshly built rows start empty.
    rebuildRows_(this: PromptTemplateBlock) {
      Blockly.Events.disable()
      try {
        for (const input of [...this.inputList]) {
          if (input.name?.startsWith('MSG_'))
            this.removeInput(input.name)
        }
        for (const turn of this.turns_) {
          this.appendDummyInput(rowInput(turn.id))
            .setAlign(Blockly.inputs.Align.RIGHT)
            .appendField(ROLE_LABEL[turn.role])
            .appendField(new DeferredTextPreview(ROLE_PLACEHOLDER[turn.role], ROW_WIDTH), textField(turn.id))
        }
      }
      finally {
        Blockly.Events.enable()
      }
      if (this.rendered) {
        this.initSvg()
        this.render()
      }
      this.updateWarning_()
    },

    // Flag the structurally-broken shapes that are a mistake on any provider:
    // no messages at all, or no user turn to prompt a response. Keyed on roles,
    // not content, so it does not nag while a fresh row is still being typed.
    updateWarning_(this: PromptTemplateBlock) {
      let warning: string | null = null
      if (this.turns_.length === 0)
        warning = 'This template has no messages. Add one from the gear menu.'
      else if (!this.turns_.some(turn => turn.role === 'user'))
        warning = 'No user message. Most models need a user turn to respond.'
      this.setWarningText(warning)
    },

    // Replace the turns and their content in one pass: rebuild the rows, then
    // restore each row's text from the supplied map.
    setTurns_(this: PromptTemplateBlock, turns: Turn[], contentById: Record<string, string>) {
      this.turns_ = turns
      this.rebuildRows_()
      for (const turn of turns)
        this.setFieldValue(contentById[turn.id] ?? '', textField(turn.id))
    },

    // -------------------------------------------------------------------
    // Mutator
    // -------------------------------------------------------------------

    decompose(this: PromptTemplateBlock, workspace: Blockly.Workspace): Blockly.BlockSvg {
      const container = workspace.newBlock(CONTAINER_TYPE) as Blockly.BlockSvg
      container.initSvg()
      let connection = container.getInput('STACK')!.connection!
      for (const turn of this.turns_) {
        const clause = workspace.newBlock(CLAUSE_TYPE[turn.role]) as Blockly.BlockSvg & { turnId_?: string }
        clause.initSvg()
        clause.turnId_ = turn.id
        connection.connect(clause.previousConnection!)
        connection = clause.nextConnection!
      }
      return container
    },

    compose(this: PromptTemplateBlock, container: Blockly.BlockSvg) {
      // Snapshot current text so surviving turns keep their content across the
      // rebuild, keyed by the id stamped on each clause in `decompose`.
      const content: Record<string, string> = {}
      for (const turn of this.turns_)
        content[turn.id] = this.getFieldValue(textField(turn.id)) ?? ''

      const turns: Turn[] = []
      const nextContent: Record<string, string> = {}
      const seen = new Set<string>()
      let clause = container.getInputTargetBlock('STACK') as (Blockly.Block & { turnId_?: string }) | null
      while (clause) {
        const role = ROLE_BY_CLAUSE[clause.type]
        if (role) {
          // A clause dragged in from the flyout has no id (a new turn); a
          // duplicated clause reusing an id is treated as new to stay unique.
          const reuse = clause.turnId_ && !seen.has(clause.turnId_) ? clause.turnId_ : null
          const id = reuse ?? nextTurnId()
          seen.add(id)
          turns.push({ id, role })
          nextContent[id] = reuse ? (content[reuse] ?? '') : ''
        }
        clause = clause.getNextBlock() as (Blockly.Block & { turnId_?: string }) | null
      }

      this.setTurns_(turns, nextContent)
    },

    // -------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------

    saveExtraState(this: PromptTemplateBlock) {
      return { messages: templateMessages(this) }
    },

    loadExtraState(
      this: PromptTemplateBlock,
      state: { messages?: Array<{ role: Role, content: string }>, system?: string, user?: string },
    ) {
      // New shape: an ordered messages array. Old shape: { system, user }.
      const messages = state.messages ?? [
        ...(state.system ? [{ role: 'system' as Role, content: state.system }] : []),
        { role: 'user' as Role, content: state.user ?? '' },
      ]
      const turns: Turn[] = []
      const content: Record<string, string> = {}
      for (const message of messages) {
        const id = nextTurnId()
        turns.push({ id, role: message.role })
        content[id] = message.content
      }
      this.setTurns_(turns, content)
    },
  }
}
