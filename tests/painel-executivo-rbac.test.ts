import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../server/utils/db', () => ({ query: mocks.query }))

import { obterPainelExecutivo, type EscopoPainel } from '../server/utils/painel-executivo'
import { ehSaturacaoDePool } from '../server/utils/pool-error'

const semAcesso: EscopoPainel = {
  releases: false,
  manuais: false,
  escopos: false,
  chamadas: false,
  softwares: false,
  parceiros: false
}

describe('RBAC do Painel Executivo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.query.mockResolvedValue([])
  })

  it('não consulta dados quando nenhum bloco é permitido', async () => {
    const painel = await obterPainelExecutivo(2026, semAcesso)
    expect(mocks.query).not.toHaveBeenCalled()
    expect(painel.kpis.chamadasLancadas).toBe(0)
    expect(painel.porSoftware).toEqual([])
    expect(painel.porPublicacao.releases).toEqual([])
  })

  it('mantém o shape e zera chamadas quando só publicações são permitidas', async () => {
    const painel = await obterPainelExecutivo(2026, {
      ...semAcesso,
      releases: true
    })
    expect(painel.kpis.chamadasLancadas).toBe(0)
    expect(painel.serieMensal.every((ponto) => ponto.chamadasLancadas === 0)).toBe(true)
    expect(painel.porSoftware).toEqual([])
    expect(painel.porTipo).toEqual([])
    expect(painel.porImpacto).toEqual([])
  })
})

describe('saturação do pool', () => {
  it('reconhece o erro de fila do mysql2', () => {
    expect(ehSaturacaoDePool(new Error('Queue limit reached.'))).toBe(true)
    expect(ehSaturacaoDePool(Object.assign(new Error('x'), { code: 'ER_CON_COUNT_ERROR' }))).toBe(true)
    expect(ehSaturacaoDePool(new Error('Duplicate entry'))).toBe(false)
    expect(ehSaturacaoDePool(null)).toBe(false)
  })
})