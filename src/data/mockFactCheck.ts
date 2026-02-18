import type { FactCheckResults } from '@/components/FactCheckOutput.vue'

export const mockFactCheckResults: FactCheckResults = {
  claims: [
    {
      text: 'The Earth is approximately 4.5 billion years old.',
      verdict: 'true',
      category: 'supported',
      evidence: [
        {
          source: 'NASA',
          summary: 'Scientific consensus based on radiometric dating of meteorites and Earth rocks confirms the Earth formed about 4.54 billion years ago.',
          supports: 'supports',
        },
        {
          source: 'Nature Journal',
          summary: 'Multiple independent dating methods consistently yield ages of 4.5-4.6 billion years for the oldest Earth materials.',
          supports: 'supports',
        },
      ],
      reasoning: 'Multiple peer-reviewed scientific sources confirm this claim using independent dating methods.',
    },
    {
      text: 'Coffee consumption has no health effects.',
      verdict: 'false',
      category: 'conflicted',
      evidence: [
        {
          source: 'Harvard Health',
          summary: 'Moderate coffee consumption is associated with reduced risk of type 2 diabetes and some cardiovascular benefits.',
          supports: 'contradicts',
        },
        {
          source: 'Mayo Clinic',
          summary: 'Coffee can cause insomnia, nervousness, and increased heart rate in some individuals.',
          supports: 'contradicts',
        },
      ],
      reasoning: 'The claim is false because coffee has both positive and negative health effects depending on consumption levels and individual factors.',
    },
    {
      text: 'Artificial intelligence will replace all jobs by 2030.',
      verdict: 'unverified',
      category: 'controversial',
      evidence: [
        {
          source: 'World Economic Forum',
          summary: 'AI is expected to create 97 million new jobs while displacing 85 million by 2025.',
          supports: 'contradicts',
        },
        {
          source: 'MIT Technology Review',
          summary: 'AI will transform rather than eliminate most jobs, with some sectors more affected than others.',
          supports: 'neutral',
        },
      ],
      reasoning: 'Expert consensus suggests AI will transform employment rather than eliminate all jobs. The 2030 timeline is speculative.',
    },
  ],
  summary: 'Analysis complete. 1 claim verified as true, 1 claim found to be false, and 1 claim remains controversial with mixed evidence.',
  totalEvidences: 6,
  overallFactuality: false,
  overallCredibility: 0.65,
}
