import { describe, it, expect } from 'vitest'
import { REGIOES, REGIAO_POR_UF, UFS, regiaoDaUf } from '../app/config/brasil'

describe('derivação de região pela UF', () => {
  it('mapeia todas as 27 UFs para uma das 5 regiões', () => {
    expect(UFS).toHaveLength(27)
    expect(Object.keys(REGIAO_POR_UF)).toHaveLength(27)
    for (const uf of UFS) {
      expect(REGIOES.map((r) => r.value)).toContain(regiaoDaUf(uf.value))
    }
  })

  it('resolve exemplos', () => {
    expect(regiaoDaUf('SP')).toBe('Sudeste')
    expect(regiaoDaUf('am')).toBe('Norte')
    expect(regiaoDaUf('RS')).toBe('Sul')
    expect(regiaoDaUf('')).toBe('')
  })
})
