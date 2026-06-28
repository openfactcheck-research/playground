import { register as registerAgent } from './agent'
import { register as registerLanguageModel } from './languageModel'
import { register as registerPromptTemplate } from './promptTemplate'
import { register as registerStructuredOutput } from './structuredOutput'
import { register as registerTextInput } from './textInput'
import { installVarNaming } from './varNames'

export function registerAllBlocks(): void {
  installVarNaming()
  registerTextInput()
  registerLanguageModel()
  registerPromptTemplate()
  registerAgent()
  registerStructuredOutput()
}
