import type * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE, SCHEMA_FIELD } from '@/blockly/blocks/structuredOutput'
import { varNameFor } from './varNames'

type SchemaField = {
  name: string
  description: string
  type: string
  asList: boolean
  children?: SchemaField[]
}

// Maps a schema field type onto its Python annotation. `dict` resolves to a
// nested model when the field has children (handled in buildModels).
const TYPE_MAP: Record<string, string> = {
  str: 'str',
  int: 'int',
  float: 'float',
  bool: 'bool',
  list: 'list',
  dict: 'dict',
}

function pascalCase(name: string): string {
  return name.replace(/(?:^|_)(\w)/g, (_, c: string) => c.toUpperCase())
}

function pyString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

// True when any field, at any depth, carries a description (so the import
// pulls in `Field`).
function usesField(fields: SchemaField[]): boolean {
  return fields.some(f => !!f.description?.trim() || (f.children ? usesField(f.children) : false))
}

// Build the Pydantic class definitions for a schema. Nested models come first
// so each is defined before the model that references it.
function buildModels(className: string, fields: SchemaField[]): string {
  const nested: string[] = []
  const lines = [`class ${className}(BaseModel):`]
  if (fields.length === 0)
    lines.push('    pass')

  for (const field of fields) {
    let base: string
    if (field.type === 'dict' && field.children?.length) {
      const nestedName = `${className}${pascalCase(field.name)}`
      nested.push(buildModels(nestedName, field.children))
      base = nestedName
    }
    else {
      base = TYPE_MAP[field.type] ?? 'str'
    }
    const annotation = field.asList ? `list[${base}]` : base
    lines.push(field.description?.trim()
      ? `    ${field.name}: ${annotation} = Field(description="${pyString(field.description)}")`
      : `    ${field.name}: ${annotation}`)
  }

  return [...nested, lines.join('\n')].join('\n\n\n')
}

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string => {
    const modelName = varNameFor(block, generator, 'Output')

    let fields: SchemaField[] = []
    try {
      fields = JSON.parse(block.getFieldValue(SCHEMA_FIELD) || '[]') as SchemaField[]
    }
    catch {
      fields = []
    }

    // Hoist the import and the model definitions to the top of the file.
    const defs = (generator as unknown as { definitions_: Record<string, string> }).definitions_
    const needsField = usesField(fields) || defs.import_pydantic?.includes('Field')
    defs.import_pydantic = needsField
      ? 'from pydantic import BaseModel, Field'
      : 'from pydantic import BaseModel'
    defs[`model_${modelName}`] = buildModels(modelName, fields)

    return ''
  }
}
