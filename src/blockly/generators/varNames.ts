import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'

// Per-generation map of block id to the Python variable name assigned to that block.
// Cleared at the start of every generation pass so names restart from their base each run.
const assigned = new Map<string, string>()

let installed = false

// Chain a reset onto the generator's per-pass setup so the block-id cache never leaks
// across passes; the name pool is reset in the same place, so allocations stay aligned.
export function installVarNaming(): void {
  if (installed)
    return
  installed = true
  const originalInit = pythonGenerator.init.bind(pythonGenerator)
  pythonGenerator.init = function (this: typeof pythonGenerator, workspace: Blockly.Workspace): void {
    originalInit(workspace)
    assigned.clear()
  }
}

// Return the distinct Python variable name for a block, allocating one from the shared
// name pool on first request and reusing it on every later request in the same pass.
//
// Two blocks of the same kind get distinct names (`client`, `client2`), and a parent
// block can recover a child's real name by calling this with the child's block: a lone
// block keeps the readable base, duplicates are numbered.
export function varNameFor(
  block: Blockly.Block,
  generator: typeof pythonGenerator,
  base: string,
): string {
  let name = assigned.get(block.id)
  if (name === undefined) {
    name = generator.nameDB_!.getDistinctName(base, Blockly.Names.NameType.VARIABLE)
    assigned.set(block.id, name)
  }
  return name
}

// Allocate a fresh distinct name from the shared pool, not tied to any block. Use it for
// a local variable a block needs alongside its own name (which varNameFor gives), since
// varNameFor returns one name per block. Distinct across the pass, so it never clashes.
export function distinctName(generator: typeof pythonGenerator, base: string): string {
  return generator.nameDB_!.getDistinctName(base, Blockly.Names.NameType.VARIABLE)
}
