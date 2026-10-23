import { describe, expect, it, vi } from 'vitest'
import { revogarSessoesDoUsuario } from '../server/utils/auth'

describe('revogação de sessões no reset de senha', () => {
  it('incrementa token_version e revoga as sessões abertas do usuário', async () => {
    const exec = vi.fn(async () => [])
    await revogarSessoesDoUsuario('usuario-1', exec)

    const sqls = exec.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('token_version = token_version + 1'))).toBe(true)
    expect(sqls.some((sql) => sql.includes('UPDATE sessoes SET revogado_em'))).toBe(true)
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('WHERE usuario_id = ?'),
      expect.arrayContaining(['usuario-1'])
    )
  })
})