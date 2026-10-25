import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  pode: vi.fn(),
  carregar: vi.fn()
}))

vi.mock('../server/utils/db', () => ({ query: mocks.query }))
vi.mock('../server/utils/permission', () => ({
  pode: mocks.pode,
  carregarPermissoesDaSessao: mocks.carregar
}))

import { validarHierarquiaPerfil } from '../server/utils/hierarquia'

const evento = {} as any

describe('hierarquia de atribuição de perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pode.mockResolvedValue(false)
    mocks.query.mockResolvedValueOnce([{ id: 'perfil-admin' }])
  })

  it('nega perfil com permissão que o ator não possui', async () => {
    mocks.query.mockResolvedValueOnce([
      { modulo: 'softwares', pode_visualizar: 1, pode_incluir: 1, pode_editar: 1, pode_excluir: 1, extras: null }
    ])
    mocks.carregar.mockResolvedValue(new Map([['softwares', new Set(['visualizar'])]]))
    await expect(validarHierarquiaPerfil(evento, 'Administrador')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('permite perfil subconjunto do ator', async () => {
    mocks.query.mockResolvedValueOnce([
      { modulo: 'softwares', pode_visualizar: 1, pode_incluir: 0, pode_editar: 0, pode_excluir: 0, extras: null }
    ])
    mocks.carregar.mockResolvedValue(new Map([['softwares', new Set(['visualizar', 'criar'])]]))
    await expect(validarHierarquiaPerfil(evento, 'Leitor')).resolves.toBeUndefined()
  })

  it('permite quem controla perfis', async () => {
    mocks.pode.mockImplementation(async (_e: any, modulo: string, acao: string) => modulo === 'perfis-acesso' && acao === 'alterar')
    await expect(validarHierarquiaPerfil(evento, 'Administrador')).resolves.toBeUndefined()
    expect(mocks.carregar).not.toHaveBeenCalled()
  })
})