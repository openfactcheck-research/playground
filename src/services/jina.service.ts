/**
 * Jina Reader API Service
 * Fetches clean text from any URL via https://r.jina.ai
 */

const JINA_READER_URL = 'https://r.jina.ai/'

export async function fetchTextFromUrl(url: string): Promise<string> {
  const response = await fetch(`${JINA_READER_URL}${encodeURIComponent(url)}`, {
    headers: { Accept: 'text/plain' },
  })
  if (!response.ok)
    throw new Error(`Jina reader returned ${response.status}`)
  return response.text()
}
