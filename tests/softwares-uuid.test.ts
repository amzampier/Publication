import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}))

vi.mock('../server/utils/db', () => ({
  query: mocks.query,
  getTransaction: vi.fn()
}))

import { buscarSoftware, listarSoftwares } from '../server/utils/softwares'

describe('UUID de Software', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('expõe uuid na listagem', async () => {
    mocks.query.mockResolvedValueOnce([
      {
        codigo: 'SFT-001',
        uuid: '00000000-0000-4000-8000-000000000001',
        descricao: 'Software',
        categoria: 'Delphi',
        situacao: 'Ativo',
        criado_em: '2026-01-01T00:00:00.000Z',
        atualizado_em: '2026-01-01T00:00:00.000Z'
      }
    ])

    const [software] = await listarSoftwares()
    expect(software?.uuid).toBe('00000000-0000-4000-8000-000000000001')
    expect(software?.codigo).toBe('SFT-001')
  })

  it('expõe uuid na busca por código', async () => {
    mocks.query.mockResolvedValueOnce([
      {
        codigo: 'SFT-001',
        uuid: '00000000-0000-4000-8000-000000000001',
        descricao: 'Software',
        categoria: 'Delphi',
        situacao: 'Ativo',
        criado_em: '2026-01-01T00:00:00.000Z',
        atualizado_em: '2026-01-01T00:00:00.000Z'
      }
    ])

    const software = await buscarSoftware('SFT-001')
    expect(software?.uuid).toBe('00000000-0000-4000-8000-000000000001')
  })
})
