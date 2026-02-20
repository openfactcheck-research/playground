/**
 * Pipeline Templates
 * Pre-built fact-checking workflow templates
 */

import evidenceRetrieval from './templates/evidence-retrieval.json'
import quickCheck from './templates/quick-check.json'
import simpleVerification from './templates/simple-verification.json'

export type PipelineTemplate = {
  id: string
  name: string
  description: string
  icon: string
  category: 'basic' | 'research'
  /** Blockly workspace state (JSON serialization format) */
  state: object
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  simpleVerification,
  evidenceRetrieval,
  quickCheck,
] as PipelineTemplate[]

export function getTemplatesByCategory(category: PipelineTemplate['category']): PipelineTemplate[] {
  return PIPELINE_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): PipelineTemplate | undefined {
  return PIPELINE_TEMPLATES.find(t => t.id === id)
}
