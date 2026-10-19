import { describe, it, expect } from 'vitest'
import {
  FUNCIONALIDADES_POR_MODULO as APP,
  FUNCIONALIDADES_FIXAS as APP_FIXAS,
  FUNCIONALIDADES_EXTRAS as APP_EXTRAS
} from '../app/config/perfis'
import {
  FUNCIONALIDADES_POR_MODULO as SRV,
  FUNCIONALIDADES_FIXAS as SRV_FIXAS,
  FUNCIONALIDADES_EXTRAS as SRV_EXTRAS,
  validarMatriz
} from '../server/utils/perfis'

interface ErroApi {
  statusCode?: number
}

const capturar = (fn: () => unknown): ErroApi => {
  try {
    fn()
  } catch (erro) {
    return erro as ErroApi
  }
  throw new Error('esperava um erro')
}

describe('catálogo de funcionalidades por módulo (sincronia app × server)', () => {
  it('lista os mesmos módulos', () => {
    expect(Object.keys(SRV).sort()).toEqual(Object.keys(APP).sort())
  })

  it('tem as mesmas funcionalidades por módulo', () => {
    for (const modulo of Object.keys(SRV)) {
      expect([...(SRV[modulo] ?? [])]).toEqual([...(APP[modulo] ?? [])])
    }
  })

  it('fixas e extras coincidem', () => {
    expect([...SRV_FIXAS]).toEqual([...APP_FIXAS])
    expect([...SRV_EXTRAS].sort()).toEqual([...APP_EXTRAS].sort())
  })

  it('total do catálogo é 88', () => {
    const total = Object.values(SRV).reduce((soma, acoes) => soma + acoes.length, 0)
    expect(total).toBe(88)
  })
})

describe('validarMatriz por catálogo', () => {
  it('aceita apenas funcionalidades do módulo', () => {
    expect(validarMatriz({ 'perfis-acesso': ['visualizar', 'permissoes', 'exportar', 'filtrar'] })).toEqual({
      'perfis-acesso': ['visualizar', 'permissoes', 'exportar', 'filtrar']
    })
  })

  it('recusa funcionalidade fora do catálogo do módulo', () => {
    expect(capturar(() => validarMatriz({ 'perfis-acesso': ['publicar'] })).statusCode).toBe(400)
    expect(capturar(() => validarMatriz({ 'configuracoes-globais': ['importar'] })).statusCode).toBe(400)
  })

  it('recusa módulo desconhecido', () => {
    expect(capturar(() => validarMatriz({ desconhecido: ['visualizar'] })).statusCode).toBe(400)
  })

  it('recusa clonar sem criar no release-week', () => {
    expect(
      capturar(() => validarMatriz({ 'release-week': ['visualizar', 'clonar'] })).statusCode
    ).toBe(400)
  })

  it('aceita clonar junto com criar no release-week', () => {
    expect(
      validarMatriz({ 'release-week': ['visualizar', 'criar', 'clonar', 'visualizar_itens'] })
    ).toEqual({ 'release-week': ['visualizar', 'criar', 'clonar', 'visualizar_itens'] })
  })
})
