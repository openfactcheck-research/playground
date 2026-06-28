import { register as registerAgentGenerator } from './agent'
import { register as registerLanguageModelGenerator } from './languageModel'
import { register as registerPromptTemplateGenerator } from './promptTemplate'
import { register as registerStructuredOutputGenerator } from './structuredOutput'
import { register as registerTextInputGenerators } from './textInput'
import { installVarNaming } from './varNames'

export function registerAllGenerators(): void {
  installVarNaming()
  registerTextInputGenerators()
  registerLanguageModelGenerator()
  registerPromptTemplateGenerator()
  registerAgentGenerator()
  registerStructuredOutputGenerator()
}
