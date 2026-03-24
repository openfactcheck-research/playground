// ---------------------------------------------------------------------------
// Toolbox configuration for the Blockly workspace.
// ---------------------------------------------------------------------------

function block(type: string, extra?: object) {
  return { kind: 'block' as const, type, ...extra }
}

function sep(gap?: string) {
  return gap ? { kind: 'sep' as const, gap } : { kind: 'sep' as const }
}

function category(name: string, categorystyle: string, contents?: object[], custom?: string) {
  return { kind: 'category' as const, name, categorystyle, ...(custom ? { custom } : { contents }) }
}

const logicCategory = category('Logic', 'logic_category', [
  block('controls_if'),
  block('logic_compare'),
  block('logic_operation'),
  block('logic_negate'),
  block('logic_boolean'),
  block('logic_null'),
  block('logic_ternary'),
])

const loopsCategory = category('Loops', 'loop_category', [
  block('controls_repeat_ext'),
  block('controls_whileUntil'),
  block('controls_for'),
  block('controls_forEach'),
  block('controls_flow_statements'),
])

const mathCategory = category('Math', 'math_category', [
  block('math_number'),
  block('math_arithmetic'),
  block('math_single'),
  block('math_trig'),
  block('math_constant'),
  block('math_number_property'),
  block('math_round'),
  block('math_on_list'),
  block('math_modulo'),
  block('math_constrain'),
  block('math_random_int'),
  block('math_random_float'),
])

const textCategory = category('Text', 'text_category', [
  block('text'),
  block('text_join'),
  block('text_append'),
  block('text_length'),
  block('text_isEmpty'),
  block('text_indexOf'),
  block('text_charAt'),
  block('text_getSubstring'),
  block('text_changeCase'),
  block('text_trim'),
  block('text_print'),
])

const listsCategory = category('Lists', 'list_category', [
  block('lists_create_with'),
  block('lists_repeat'),
  block('lists_length'),
  block('lists_isEmpty'),
  block('lists_indexOf'),
  block('lists_getIndex'),
  block('lists_setIndex'),
  block('lists_getSublist'),
  block('lists_sort'),
  block('lists_reverse'),
])

const variablesCategory = category('Variables', 'variable_category', undefined, 'VARIABLE')
const functionsCategory = category('Functions', 'procedure_category', undefined, 'PROCEDURE')
const ioCategory = category('Input & Output', 'io_category', [
  block('text_input'),
])
const modelsAgentsCategory = category('Models & Agents', 'models_category', [
  block('agent'),
  block('language_model'),
  block('prompt_template'),
  block('structured_output'),
])

export const toolboxConfig = {
  kind: 'categoryToolbox',
  contents: [
    ioCategory,
    modelsAgentsCategory,
    sep(),
    logicCategory,
    loopsCategory,
    mathCategory,
    textCategory,
    listsCategory,
    sep(),
    variablesCategory,
    functionsCategory,
  ],
}
