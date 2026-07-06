/**
 * Fact-check result types — the shape a pipeline's `Result` serializes to, used to
 * beautify a run's JSON output in the Results panel.
 */

export type VerdictLabel = 'supported' | 'refuted' | 'not_enough_evidence'

export type Source = {
  content: string
  metadata?: { url?: string, title?: string }
}

export type Verdict = {
  claim: { text: string }
  label: VerdictLabel
  confidence: number | null
  reasoning: string
  error: string | null
  correction: string | null
  evidence: { sources: Source[] } | null
}

export type ResultSummary = {
  supported: number
  refuted: number
  not_enough_evidence: number
  total: number
  factual: boolean | null
}

export type FactCheckResult = {
  verdicts: Verdict[]
  revision: string | null
  attribution: Source[] | null
  summary: ResultSummary
}

// Parse a run's output string into a fact-check result, or null when it is not one
// (free-text output from another block, malformed JSON, and so on).
export function parseResult(output: string): FactCheckResult | null {
  let data: unknown
  try {
    data = JSON.parse(output)
  }
  catch {
    return null
  }
  if (data !== null && typeof data === 'object' && Array.isArray((data as { verdicts?: unknown }).verdicts))
    return data as FactCheckResult
  return null
}
