import { describe, expect, it } from 'vitest'
import { getSessionUser } from '../server/utils/auth'

describe('getSessionUser', () => {
  it('reutiliza a sessão já resolvida no contexto do evento', async () => {
    const sessao = {
      id: 'usuario-1',
      nome: 'Teste',
      perfil: 'Administrador',
      tokenVersion: 1
    }
    const event = { context: { sessaoUsuario: sessao } }
    await expect(getSessionUser(event)).resolves.toBe(sessao)
  })

  it('reutiliza também a sessão nula já cacheada', async () => {
    const event = { context: { sessaoUsuario: null } }
    await expect(getSessionUser(event)).resolves.toBeNull()
  })
})
