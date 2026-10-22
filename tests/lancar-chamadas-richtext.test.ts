import { describe, it, expect } from 'vitest'
import { richTextParaTexto, sanitizarRichText } from '../server/utils/richText'

describe('sanitizarRichText', () => {
  it('mantém negrito, parágrafos, quebras e cor/tamanho da allowlist', () => {
    const entrada =
      '<p>Olá <strong>mundo</strong><br>linha 2 ' +
      '<span style="color: #dc2626">vermelho</span> ' +
      '<span style="font-size: 1.3em">grande</span></p>'
    const saida = sanitizarRichText(entrada)
    expect(saida).toContain('<strong>mundo</strong>')
    expect(saida).toContain('<br')
    expect(saida).toContain('#dc2626')
    expect(saida).toContain('1.3em')
  })

  it('remove script, manipuladores de evento e tags fora da allowlist', () => {
    const saida = sanitizarRichText(
      '<p>ok</p><script>alert(1)</script><img src="x" onerror="alert(1)"><h1>t</h1>'
    )
    expect(saida).toContain('<p>ok</p>')
    expect(saida).not.toMatch(/script|onerror|<img|<h1/i)
  })

  it('descarta cor e tamanho fora da allowlist', () => {
    const saida = sanitizarRichText(
      '<p><span style="color: #ff0000; font-size: 42px">x</span></p>'
    )
    expect(saida).not.toMatch(/#ff0000|42px/)
    expect(saida).toContain('x')
  })

  it('remove span sem estilo restante', () => {
    expect(sanitizarRichText('<p><span>texto</span></p>')).toBe('<p>texto</p>')
  })

  it('retorna vazio para conteúdo sem texto', () => {
    expect(sanitizarRichText('<p></p>')).toBe('')
    expect(sanitizarRichText('')).toBe('')
    expect(sanitizarRichText(undefined)).toBe('')
  })
})

describe('richTextParaTexto', () => {
  it('preserva quebras de linha de <br> e de parágrafos', () => {
    expect(richTextParaTexto('<p>a<br>b</p><p>c</p>')).toBe('a\nb\nc')
  })

  it('decodifica entidades e remove a marcação', () => {
    expect(richTextParaTexto('<p><strong>a &amp; b</strong> &lt;x&gt;</p>')).toBe('a & b <x>')
  })

  it('normaliza espaços e linhas em branco excessivas', () => {
    expect(richTextParaTexto('<p>a&nbsp;   </p><p></p><p></p><p>b</p>')).toBe('a\n\nb')
  })

  it('retorna vazio para entrada vazia', () => {
    expect(richTextParaTexto('')).toBe('')
    expect(richTextParaTexto(null)).toBe('')
  })
})
