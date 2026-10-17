import { describe, it, expect } from 'vitest'
import {
  CATEGORIAS,
  SITUACOES,
  validarCategoriaSoftware,
  validarDescricaoSoftware,
  validarLinhaImportacao,
  validarSituacaoSoftware
} from '../server/utils/softwares'

interface ErroApi {
  statusCode?: number
  statusMessage?: string
}

const capturar = (fn: () => unknown): ErroApi => {
  try {
    fn()
  } catch (erro) {
    return erro as ErroApi
  }
  throw new Error('esperava um erro')
}

describe('validarDescricaoSoftware', () => {
  it('aceita descrição válida e faz trim', () => {
    expect(validarDescricaoSoftware('  Teorema ERP  ')).toBe('Teorema ERP')
  })
  it('recusa vazia ou só espaços', () => {
    expect(capturar(() => validarDescricaoSoftware('')).statusCode).toBe(400)
    expect(capturar(() => validarDescricaoSoftware('   ')).statusCode).toBe(400)
    expect(capturar(() => validarDescricaoSoftware(123)).statusCode).toBe(400)
  })
  it('recusa acima de 200 caracteres', () => {
    expect(validarDescricaoSoftware('a'.repeat(200))).toHaveLength(200)
    expect(capturar(() => validarDescricaoSoftware('a'.repeat(201))).statusCode).toBe(400)
  })
})

describe('validarCategoriaSoftware', () => {
  it('aceita o domínio', () => {
    for (const c of CATEGORIAS) expect(validarCategoriaSoftware(c)).toBe(c)
  })
  it('recusa fora do domínio', () => {
    expect(capturar(() => validarCategoriaSoftware('Mobile')).statusCode).toBe(400)
    expect(capturar(() => validarCategoriaSoftware(undefined)).statusCode).toBe(400)
  })
})

describe('validarSituacaoSoftware', () => {
  it('aceita o domínio', () => {
    for (const s of SITUACOES) expect(validarSituacaoSoftware(s)).toBe(s)
  })
  it('recusa fora do domínio', () => {
    expect(capturar(() => validarSituacaoSoftware('Suspenso')).statusCode).toBe(400)
  })
})

describe('validarLinhaImportacao', () => {
  it('normaliza a linha válida', () => {
    expect(
      validarLinhaImportacao({ descricao: ' WMS ', categoria: 'Delphi', situacao: 'Ativo' })
    ).toEqual({ descricao: 'WMS', categoria: 'Delphi', situacao: 'Ativo' })
  })
  it('recusa categoria inválida', () => {
    expect(
      capturar(() =>
        validarLinhaImportacao({ descricao: 'WMS', categoria: 'X', situacao: 'Ativo' })
      ).statusCode
    ).toBe(400)
  })
})
