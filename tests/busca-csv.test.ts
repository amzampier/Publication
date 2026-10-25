import { describe, expect, it } from 'vitest'
import { condicaoPrefixo, pareceCodigo, termoFulltext } from '../server/utils/busca'
import { csvStream, escaparCsv } from '../server/utils/csv'

describe('adaptador de busca', () => {
  it('gera boolean mode para termos de 3+ caracteres', () => {
    expect(termoFulltext('fiscal')).toBe('+fiscal*')
    expect(termoFulltext('nota fiscal')).toBe('+nota* +fiscal*')
    expect(termoFulltext('ab')).toBeNull()
  })

  it('trata códigos/e-mails como prefixo e remove operadores do MATCH', () => {
    expect(pareceCodigo('MAN-10/2026')).toBe(true)
    expect(pareceCodigo('admin@empresa.com')).toBe(true)
    expect(pareceCodigo('fiscal')).toBe(false)
    expect(termoFulltext('---')).toBeNull()
    expect(termoFulltext('nota fiscal')).toBe('+nota* +fiscal*')
  })
  it('gera prefixo com escape para códigos/termos curtos', () => {
    const condicao = condicaoPrefixo(['e.chamada', 'e.titulo'], 'SFT%')
    expect(condicao.sql).toBe('(e.chamada LIKE ? OR e.titulo LIKE ?)')
    expect(condicao.params).toEqual(['SFT\\%%', 'SFT\\%%'])
  })
})

describe('CSV streaming', () => {
  it('escapa aspas, quebras e fórmulas', () => {
    expect(escaparCsv('a"b')).toBe('"a""b"')
    expect(escaparCsv('=1+1')).toBe("\"'=1+1\"")
    expect(escaparCsv('linha\nquebrada')).toBe('"linha\nquebrada"')
  })

  it('entrega cabeçalho e linhas em partes', async () => {
    async function* linhas() {
      yield ['a', 'b']
      yield ['c', 'd']
    }
    const stream = csvStream(['X', 'Y'], linhas(), () => false)
    let texto = ''
    for await (const chunk of stream) texto += chunk
    expect(texto).toContain('"X";"Y"')
    expect(texto).toContain('"a";"b"')
    expect(texto).toContain('"c";"d"')
  })
})