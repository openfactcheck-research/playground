import { register as registerLanguageModel } from './languageModel'
import { register as registerTextInput } from './textInput'

export function registerAllBlocks(): void {
  registerTextInput()
  registerLanguageModel()
}
