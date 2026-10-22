import { describe, it, expect } from 'vitest'
import {
  CORES_TEXTO_RICO,
  MAX_TEXTO_RICO,
  TAMANHOS_TEXTO_RICO,
  VALORES_COR_TEXTO_RICO,
  VALORES_TAMANHO_TEXTO_RICO,
  corTextoRicoPermitida,
  escaparHtml,
  tamanhoTextoRicoPermitido,
  textoParaRichText
} from '../shared/rich-text'

describe('allowlist de texto rico', () => {
  it('inclui o vermelho de conteúdo distinto do vermelho de erro', () => {
    expect(VALORES_COR_TEXTO_RICO).toContain('#dc2626')
    expect(VALORES_COR_TEXTO_RICO).toContain('#be123c')
    expect(CORES_TEXTO_RICO.find((cor) => cor.valor === '#dc2626')?.rotulo).toBe('Vermelho')
  })

  it('expõe os quatro tamanhos relativos', () => {
    expect(VALORES_TAMANHO_TEXTO_RICO).toEqual(['0.9em', '1em', '1.15em', '1.3em'])
    expect(TAMANHOS_TEXTO_RICO).toHaveLength(4)
  })

  it('valida cores e tamanhos da allowlist', () => {
    expect(corTextoRicoPermitida('#112051')).toBe(true)
    expect(corTextoRicoPermitida('#ff0000')).toBe(false)
    expect(corTextoRicoPermitida(undefined)).toBe(false)
    expect(tamanhoTextoRicoPermitido('1.3em')).toBe(true)
    expect(tamanhoTextoRicoPermitido('42px')).toBe(false)
    expect(tamanhoTextoRicoPermitido(null)).toBe(false)
  })

  it('define o teto do texto rico', () => {
    expect(MAX_TEXTO_RICO).toBe(20000)
  })
})

describe('escaparHtml', () => {
  it('neutraliza caracteres reservados', () => {
    expect(escaparHtml('<script>"x"&\'y\'</script>')).toBe(
      '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;'
    )
  })
})

describe('textoParaRichText', () => {
  it('escapa o conteúdo e preserva as quebras de linha', () => {
    expect(textoParaRichText('linha 1\nlinha 2')).toBe('<p>linha 1<br>linha 2</p>')
  })

  it('neutraliza marcação digitada como texto', () => {
    expect(textoParaRichText('<b>x</b>')).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p>')
  })

  it('trata CRLF e CR como quebra', () => {
    expect(textoParaRichText('a\r\nb\rc')).toBe('<p>a<br>b<br>c</p>')
  })

  it('retorna vazio quando não há conteúdo', () => {
    expect(textoParaRichText('')).toBe('')
    expect(textoParaRichText('   \n  ')).toBe('')
  })
})
