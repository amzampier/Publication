// Sanitizacao e derivacao do texto rico do modulo Lancar as Chamadas.
// O HTML do editor e entrada nao confiavel: aqui ele e reduzido a uma allowlist
// de tags/atributos (negrito, quebra, cor e tamanho de fonte) e o texto puro e
// derivado para busca/fallback. A allowlist de cores/tamanhos vem de
// `#shared/rich-text` (mesma usada pelo editor).
import sanitizeHtml from 'sanitize-html'
import {
  MAX_TEXTO_RICO,
  VALORES_COR_TEXTO_RICO,
  VALORES_TAMANHO_TEXTO_RICO
} from '#shared/rich-text'

/** Limite defensivo do HTML recebido antes da sanitizacao (MEDIUMTEXT e' 16 MB). */
const LIMITE_HTML = MAX_TEXTO_RICO * 50

const escaparRegex = (valor: string): string => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const regexValores = (valores: string[], flags = ''): RegExp =>
  new RegExp(`^(${valores.map(escaparRegex).join('|')})$`, flags)

const OPCOES_SANITIZE = {
  allowedTags: ['p', 'br', 'strong', 'span'],
  allowedAttributes: { span: ['style'] },
  allowedStyles: {
    span: {
      color: [regexValores(VALORES_COR_TEXTO_RICO, 'i')],
      'font-size': [regexValores(VALORES_TAMANHO_TEXTO_RICO)]
    }
  },
  selfClosing: ['br']
}

/** Desembrulha spans que ficaram sem `style` (a allowlist pode ter removido o
 *  estilo invalido) preservando o texto interno. */
const removerSpansSemEstilo = (html: string): string => {
  let anterior = ''
  let atual = html
  while (anterior !== atual) {
    anterior = atual
    atual = atual.replace(/<span>([\s\S]*?)<\/span>/gi, '$1')
  }
  return atual
}

const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
}

const decodificarEntidades = (texto: string): string =>
  texto
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (original, nome: string) => ENTIDADES[nome.toLowerCase()] ?? original)

/**
 * Reduz o HTML recebido a allowlist do design system. Retorna `''` quando o
 * conteudo nao tem texto (ex.: `<p></p>`), para nao persistir HTML vazio.
 */
export function sanitizarRichText(valor: unknown): string {
  const html = typeof valor === 'string' ? valor : ''
  if (!html.trim()) return ''
  const limitado = html.length > LIMITE_HTML ? html.slice(0, LIMITE_HTML) : html
  const limpo = removerSpansSemEstilo(sanitizeHtml(limitado, OPCOES_SANITIZE))
  return richTextParaTexto(limpo) ? limpo : ''
}

/**
 * Deriva o texto puro do HTML sanitizado: quebras de linha preservadas
 * (`<br>` e fim de paragrafo), entidades decodificadas e espacos normalizados.
 */
export function richTextParaTexto(valor: unknown): string {
  const html = typeof valor === 'string' ? valor : ''
  if (!html) return ''
  const comQuebras = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
  const texto = sanitizeHtml(comQuebras, { allowedTags: [], allowedAttributes: {} })
  return decodificarEntidades(texto)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
