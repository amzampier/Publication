import { describe, expect, it } from 'vitest'
import { montarContextoBootstrap } from '../server/utils/contexto'
import { MODULOS_IDS } from '../server/utils/perfis'
import type { ConfiguracoesGlobais } from '../server/utils/configuracoes'

const usuario = {
  id: 'usuario-1',
  nome: 'Teste',
  perfil: 'Administrador',
  provisoria: false
}

const cfg = {
  logo_header_url: '/uploads/logos/header.png',
  logo_login_url: null,
  sidebar_grupos: { publicacoes: true },
  sidebar_expandida: false
} as ConfiguracoesGlobais

describe('contexto inicial da sessão', () => {
  it('entrega usuário, shell, matriz completa e avatar sem tokenVersion', () => {
    const permissoes = new Map([['softwares', new Set(['visualizar', 'exportar'])]])
    const contexto = montarContextoBootstrap(usuario, cfg, permissoes, '/uploads/avatares/a.png')

    expect(contexto.usuario).toEqual(usuario)
    expect(contexto.usuario).not.toHaveProperty('tokenVersion')
    expect(contexto.shell).toEqual({
      logo_header_url: '/uploads/logos/header.png',
      logo_login_url: null,
      sidebar_grupos: { publicacoes: true },
      sidebar_expandida: false
    })
    expect(contexto.avatar).toBe('/uploads/avatares/a.png')
    expect(contexto.permissoes.softwares).toEqual(['visualizar', 'exportar'])
    expect(Object.keys(contexto.permissoes).sort()).toEqual([...MODULOS_IDS].sort())
    expect(contexto.permissoes['gestao-usuarios']).toEqual([])
  })
})
