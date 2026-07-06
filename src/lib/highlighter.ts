import { createHighlighter } from 'shiki'

// One shared Shiki highlighter for the whole app, created lazily on first use.
let _highlighter: ReturnType<typeof createHighlighter> | null = null

function getHighlighter(): ReturnType<typeof createHighlighter> {
  return _highlighter ??= createHighlighter({
    themes: ['vitesse-dark', 'vitesse-light'],
    langs: ['python', 'json'],
  })
}

// Highlight code to dual-theme HTML with a per-line marker, matching the code panel's
// styling (the `.shiki-wrapper` rules render the theme colours and line numbers).
export async function highlight(code: string, lang: 'python' | 'json'): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang,
    themes: { dark: 'vitesse-dark', light: 'vitesse-light' },
    defaultColor: false,
    transformers: [
      {
        line(node: any, line: number) {
          node.properties['data-line'] = line
        },
        postprocess(html: string) {
          return html.replace(/\n/g, '')
        },
      },
    ],
  })
}
