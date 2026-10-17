import { describe, it, expect } from 'vitest'
import {
  detectarTipoImagem,
  ehImagemReal,
  sanitizarNomeArquivo,
  EXTENSAO_POR_TIPO
} from '../server/utils/uploads'

const bytes = (...a: number[]) => Buffer.from(a)

describe('detectarTipoImagem', () => {
  it('detecta PNG, JPEG, GIF e WebP pelos magic bytes', () => {
    expect(detectarTipoImagem(Buffer.concat([bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), bytes(0, 0, 0, 0)]))).toBe('png')
    expect(detectarTipoImagem(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('jpeg')
    expect(detectarTipoImagem(Buffer.from('GIF89a............'))).toBe('gif')
    expect(detectarTipoImagem(Buffer.concat([Buffer.from('RIFF'), bytes(0, 0, 0, 0), Buffer.from('WEBP'), bytes(0, 0, 0, 0)]))).toBe('webp')
  })
  it('recusa conteúdo que não é imagem (HTML/SVG/texto)', () => {
    expect(detectarTipoImagem(Buffer.from('<!doctype html><script>x</script>........'))).toBeNull()
    expect(detectarTipoImagem(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>......'))).toBeNull()
    expect(ehImagemReal(Buffer.from('texto puro sem assinatura'))).toBe(false)
  })
  it('não confunde PNG-com-payload com um tipo diferente', () => {
    // magic bytes de PNG + HTML no corpo → ainda classificado como PNG (extensão segura no gravar)
    const pngComHtml = Buffer.concat([bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), Buffer.from('<html>')])
    expect(detectarTipoImagem(pngComHtml)).toBe('png')
  })
})

describe('sanitizarNomeArquivo', () => {
  it('remove caminhos e preserva apenas o basename com caracteres seguros', () => {
    expect(sanitizarNomeArquivo('../../evil.html')).toBe('evil.html')
    expect(sanitizarNomeArquivo('meu arquivo.png')).toBe('meu-arquivo.png')
    expect(sanitizarNomeArquivo('///')).toBe('arquivo')
  })
})

describe('EXTENSAO_POR_TIPO', () => {
  it('mapeia cada tipo para uma extensão de imagem segura', () => {
    expect(EXTENSAO_POR_TIPO.png).toBe('.png')
    expect(EXTENSAO_POR_TIPO.jpeg).toBe('.jpg')
    expect(EXTENSAO_POR_TIPO.webp).toBe('.webp')
    expect(EXTENSAO_POR_TIPO.gif).toBe('.gif')
  })
})