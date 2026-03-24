import { register as registerLanguageModel } from './languageModel'
import { register as registerPromptTemplate } from './promptTemplate'
import { register as registerTextInput } from './textInput'

export function registerAllBlocks(): void {
  registerTextInput()
  registerLanguageModel()
  registerPromptTemplate()
}
