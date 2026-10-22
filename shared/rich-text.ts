// Regras puras do texto rico (negrito, cor e tamanho) — compartilhadas entre o
// editor (`UiRichText`), o sanitizador do servidor (`server/utils/richText.ts`)
// e os testes. Sem imports de Nuxt/Vue nem dependências de Node.

export interface CorTextoRico {
  valor: string
  rotulo: string
}

export interface TamanhoTextoRico {
  valor: string
  rotulo: string
}

/** Cores de **conteúdo** permitidas no texto rico (contraste AA sobre branco).
 *  O vermelho de conteúdo `#dc2626` é distinto do vermelho de erro `#be123c`
 *  (`rose-700`) usado em validação. */
export const CORES_TEXTO_RICO: CorTextoRico[] = [
  { valor: '#112051', rotulo: 'Navy' },
  { valor: '#0364f7', rotulo: 'Azul' },
  { valor: '#0f7a06', rotulo: 'Verde' },
  { valor: '#047857', rotulo: 'Esmeralda' },
  { valor: '#dc2626', rotulo: 'Vermelho' },
  { valor: '#be123c', rotulo: 'Rosa' },
  { valor: '#92400e', rotulo: 'Âmbar' },
  { valor: '#334155', rotulo: 'Slate' }
]

/** Tamanhos relativos permitidos (escalam no contexto de exibição). */
export const TAMANHOS_TEXTO_RICO: TamanhoTextoRico[] = [
  { valor: '0.9em', rotulo: 'Pequeno' },
  { valor: '1em', rotulo: 'Normal' },
  { valor: '1.15em', rotulo: 'Grande' },
  { valor: '1.3em', rotulo: 'Destaque' }
]

export const VALORES_COR_TEXTO_RICO: string[] = CORES_TEXTO_RICO.map((cor) => cor.valor)
export const VALORES_TAMANHO_TEXTO_RICO: string[] = TAMANHOS_TEXTO_RICO.map((tam) => tam.valor)

/** Teto de tamanho do texto rico, medido em texto puro (caracteres). */
export const MAX_TEXTO_RICO = 20000

/** `true` quando o valor pertence à allowlist de cores de texto rico. */
export function corTextoRicoPermitida(valor: unknown): boolean {
  return typeof valor === 'string' && VALORES_COR_TEXTO_RICO.includes(valor)
}

/** `true` quando o valor pertence à allowlist de tamanhos de texto rico. */
export function tamanhoTextoRicoPermitido(valor: unknown): boolean {
  return typeof valor === 'string' && VALORES_TAMANHO_TEXTO_RICO.includes(valor)
}

/** Escapa os caracteres reservados do HTML. */
export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Converte texto puro (legado/importado) no HTML inicial do editor, escapando
 *  o conteúdo e preservando as quebras de linha como `<br>`. */
export function textoParaRichText(texto: string): string {
  const normalizado = texto.replace(/\r\n|\r/g, '\n')
  if (!normalizado.trim()) return ''
  const comQuebras = escaparHtml(normalizado).replace(/\n/g, '<br>')
  return `<p>${comQuebras}</p>`
}
