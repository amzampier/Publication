import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  txQuery: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  getTransaction: vi.fn(),
  reconciliar: vi.fn()
}))

vi.mock('../server/utils/db', () => ({
  query: mocks.query,
  getTransaction: mocks.getTransaction
}))

vi.mock('../server/utils/publicacao-pais', () => ({
  reconciliarFilhasPublicacao: mocks.reconciliar
}))

import { criarEscopo } from '../server/utils/escopo-projetos'

const entrada = {
  nome: 'Escopo Atômico',
  versao: '1',
  ano: 2026,
  dataInicio: '2026-01-01',
  dataFinal: '2026-12-31',
  dataPrevisao: '2026-12-31',
  dataPublicacao: '2026-12-28',
  status: 'Publicado',
  descricaoGeral: 'Teste'
}

describe('criação atômica de escopo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.query.mockResolvedValue([])
    mocks.commit.mockResolvedValue(undefined)
    mocks.rollback.mockResolvedValue(undefined)
    mocks.getTransaction.mockResolvedValue({
      query: mocks.txQuery,
      commit: mocks.commit,
      rollback: mocks.rollback
    })
    mocks.txQuery.mockResolvedValue([])
  })

  it('faz rollback e não commita quando a reconciliação falha', async () => {
    mocks.reconciliar.mockRejectedValue(new Error('falha na cascata'))

    await expect(criarEscopo(entrada)).rejects.toThrow('falha na cascata')
    expect(mocks.rollback).toHaveBeenCalled()
    expect(mocks.commit).not.toHaveBeenCalled()
  })

  it('faz rollback e responde 409 quando (ano, versão) colide', async () => {
    const erro = Object.assign(new Error('Duplicate entry uk_projetos_ano_versao'), { errno: 1062 })
    mocks.txQuery.mockRejectedValue(erro)

    await expect(criarEscopo(entrada)).rejects.toMatchObject({ statusCode: 409 })
    expect(mocks.rollback).toHaveBeenCalled()
    expect(mocks.commit).not.toHaveBeenCalled()
  })
})