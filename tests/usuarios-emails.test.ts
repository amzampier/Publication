import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../server/utils/db', () => ({ query: mocks.query, getTransaction: vi.fn() }))

import { buscarEmailsUsuarios } from '../server/utils/usuarios'

describe('busca de e-mails de usuários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.query.mockResolvedValue([[], []])
  })

  it('usa conteúdo literal e escapa curingas', async () => {
    await buscarEmailsUsuarios('teo')
    const params = mocks.query.mock.calls[0][1]
    expect(params[0]).toBe('%teo%')
    expect(params[1]).toBe('%teo%')

    vi.clearAllMocks()
    mocks.query.mockResolvedValue([[], []])
    await buscarEmailsUsuarios('%%')
    const paramsCuringa = mocks.query.mock.calls[0][1]
    expect(paramsCuringa[0]).toBe('%\\%\\%%')
  })

  it('limita a página a 20 itens', async () => {
    await buscarEmailsUsuarios('ana', 1, 500)
    expect(mocks.query.mock.calls[0][1][2]).toBe(20)
  })
})