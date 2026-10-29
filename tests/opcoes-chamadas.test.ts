import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../server/utils/db', () => ({ query: mocks.query }))

import {
  listarOpcoesPorTipo,
  normalizarBusca,
  normalizarLimite,
  normalizarPagina
} from '../server/utils/opcoes-chamadas'

describe('opÃ§Ãµes remotas de Chamadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.query.mockImplementation((sql: string) => {
      if (String(sql).includes('COUNT(*)')) return Promise.resolve([{ total: 3 }])
      return Promise.resolve([
        { codigo: 'SFT-001', descricao: 'Software A' },
        { codigo: 'SFT-002', descricao: 'Software B' }
      ])
    })
  })

  it('normaliza limite com padrÃ£o 20 e teto 50', () => {
    expect(normalizarLimite(undefined)).toBe(20)
    expect(normalizarLimite('0')).toBe(20)
    expect(normalizarLimite('10')).toBe(10)
    expect(normalizarLimite('999')).toBe(50)
    expect(normalizarBusca('  termo  ')).toBe('termo')
    expect(normalizarPagina(undefined)).toBe(1)
    expect(normalizarPagina('0')).toBe(1)
    expect(normalizarPagina('3')).toBe(3)
  })

  it('busca em um catÃ¡logo com escape, limite e total', async () => {
    const pagina = await listarOpcoesPorTipo('softwares', 'a%b', '10')

    expect(pagina.total).toBe(3)
    expect(pagina.hasMore).toBe(false)
    expect(pagina.itens).toEqual([
      { id: 'SFT-001', label: 'Software A', sigla: 'SFT-001' },
      { id: 'SFT-002', label: 'Software B', sigla: 'SFT-002' }
    ])

    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes("situacao = 'Ativo'"))).toBe(true)
    expect(sqls.some((sql) => sql.includes('codigo LIKE ?'))).toBe(true)
    expect(sqls.some((sql) => sql.includes('LIMIT ?'))).toBe(true)
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ? OFFSET ?'),
      ['%a\\%b%', '%a\\%b%', 11, 0]
    )
  })

  it('inclui razÃ£o social na busca de parceiros', async () => {
    mocks.query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([])
    await listarOpcoesPorTipo('parceiros', 'acme', 20)
    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('razao_social LIKE ?'))).toBe(true)
  })

  it('expÃµe a data de publicaÃ§Ã£o de projetos e manuais', async () => {
    mocks.query.mockImplementation((sql: string) => {
      if (String(sql).includes('COUNT(*)')) return Promise.resolve([{ total: 1 }])
      if (String(sql).includes('FROM projetos_escopo')) {
        return Promise.resolve([
          { id: 'pe-1', codigo: 'PE-2026.01', nome: 'Projeto A', data_publicacao: '2026-10-27', status: 'HomologaÃ§Ã£o' }
        ])
      }
      return Promise.resolve([
        { id: 'man-1', codigo: 'MAN-10/2026', titulo: 'Manual Outubro', data_publicacao: '2026-10-31', status: 'Rascunho' }
      ])
    })

    const projetos = await listarOpcoesPorTipo('projetos', 'pe', 20)
    expect(projetos.itens[0]).toMatchObject({ id: 'pe-1', dataPublicacao: '2026-10-27' })

    const manuais = await listarOpcoesPorTipo('manuais', 'man', 20)
    expect(manuais.itens[0]).toMatchObject({ id: 'man-1', dataPublicacao: '2026-10-31' })

    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('FROM projetos_escopo') && sql.includes('data_publicacao'))).toBe(true)
    expect(sqls.some((sql) => sql.includes('FROM manuais_mensal') && sql.includes('data_publicacao'))).toBe(true)
  })

  it('filtra pais em status vinculavel no servidor', async () => {
    mocks.query.mockImplementation((sql: string) => {
      if (String(sql).includes('COUNT(*)')) return Promise.resolve([{ total: 0 }])
      return Promise.resolve([])
    })

    await listarOpcoesPorTipo('releases', '', 20)
    await listarOpcoesPorTipo('projetos', '', 20)
    await listarOpcoesPorTipo('manuais', '', 20)

    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('FROM release_week') && sql.includes("status IN ('Aberta', 'Em Revisão')"))).toBe(true)
    expect(sqls.some((sql) => sql.includes('FROM projetos_escopo') && sql.includes("status IN ('Em Andamento', 'Homologação')"))).toBe(true)
    expect(sqls.some((sql) => sql.includes('FROM manuais_mensal') && sql.includes("status IN ('Rascunho', 'Em Revisão')"))).toBe(true)
  })
})
