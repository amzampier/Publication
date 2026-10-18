import { describe, it, expect } from 'vitest'
import { funcionalidadesDeConsulta } from '../server/utils/permission'

describe('funcionalidadesDeConsulta (guardas de listagem por query)', () => {
  it('listagem base exige apenas visualizar', () => {
    expect(funcionalidadesDeConsulta({})).toEqual(['visualizar'])
  })

  it('busca acrescenta buscar', () => {
    expect(funcionalidadesDeConsulta({ busca: true })).toEqual(['visualizar', 'buscar'])
  })

  it('filtros acrescentam filtrar', () => {
    expect(funcionalidadesDeConsulta({ filtros: true })).toEqual(['visualizar', 'filtrar'])
  })

  it('busca + filtros exigem as duas funcionalidades', () => {
    expect(funcionalidadesDeConsulta({ busca: true, filtros: true })).toEqual([
      'visualizar',
      'buscar',
      'filtrar'
    ])
  })

  it('exportação tem precedência e exige apenas exportar', () => {
    expect(funcionalidadesDeConsulta({ exportar: true, busca: true, filtros: true })).toEqual(['exportar'])
  })
})
