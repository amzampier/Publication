// app/composables/sessaoEstado.ts — limpeza coordenada do estado derivado da
// sessão (change corrigir-seguranca-e-sessao, D3 / RL04-A-02). Sem isto, um
// novo login na mesma aba (SPA) poderia exibir listas, contadores, matriz de
// permissões ou cache de configurações do usuário anterior.
//
// As chaves abaixo são as mesmas `useState` usadas por usePerfisModelo,
// useUsuarios, useAuditoriaModelo, usePermissions e useConfiguracoesGlobais.
// Este arquivo usa os literais de default (não importa os composables) para
// evitar ciclos de import e manter a limpeza independente.
import { useState } from '#app'

/** Chaves `useState` que compõem o estado derivado da sessão. */
export const CHAVES_ESTADO_SESSAO = [
  'perfis-base',
  'perfis-carregando',
  'perfis-carregado',
  'perfis-filtros',
  'usuarios-base',
  'usuarios-carregando',
  'usuarios-carregado',
  'usuarios-filtros',
  'usuarios-pagina',
  'usuarios-por-pagina',
  'usuarios-total',
  'usuarios-kpis',
  'usuarios-opcoes',
  'usuarios-busca',
  'auditoria-registros',
  'auditoria-carregando',
  'auditoria-carregado',
  'auditoria-opcoes',
  'auditoria-filtros',
  'auditoria-pagina',
  'auditoria-por-pagina',
  'auditoria-total',
  'auditoria-kpis',
  'auditoria-busca',
  'permissoes-usuario',
  'config-globais-cache',
  'config-shell-cache'
] as const

/** Restaura ao valor inicial todo o estado derivado da sessão no cliente. */
export function limparEstadoSessao(): void {
  // Perfis de Acesso
  useState('perfis-base', () => []).value = []
  useState<boolean>('perfis-carregando', () => false).value = false
  useState<boolean>('perfis-carregado', () => false).value = false
  useState('perfis-filtros', () => ({ perfil: '', situacao: '' })).value = { perfil: '', situacao: '' }

  // Gestão de Usuários
  useState('usuarios-base', () => []).value = []
  useState<boolean>('usuarios-carregando', () => false).value = false
  useState<boolean>('usuarios-carregado', () => false).value = false
  useState('usuarios-filtros', () => ({ usuario: '', perfil: '', status: '' })).value = {
    usuario: '',
    perfil: '',
    status: ''
  }
  useState<number>('usuarios-pagina', () => 1).value = 1
  useState<number>('usuarios-por-pagina', () => 20).value = 20
  useState<number>('usuarios-total', () => 0).value = 0
  useState('usuarios-kpis', () => ({ total: 0, ativos: 0, inativos: 0, perfisDistintos: 0 })).value = {
    total: 0,
    ativos: 0,
    inativos: 0,
    perfisDistintos: 0
  }
  useState('usuarios-opcoes', () => ({ usuarios: [], perfis: [] })).value = { usuarios: [], perfis: [] }
  useState<string>('usuarios-busca', () => '').value = ''

  // Gestão de Auditoria
  useState('auditoria-registros', () => []).value = []
  useState<boolean>('auditoria-carregando', () => false).value = false
  useState<boolean>('auditoria-carregado', () => false).value = false
  useState('auditoria-opcoes', () => ({ usuarios: [], recursos: [] })).value = { usuarios: [], recursos: [] }
  useState('auditoria-filtros', () => ({
    dataInicial: '',
    dataFinal: '',
    usuario: '',
    acao: '',
    recurso: ''
  })).value = { dataInicial: '', dataFinal: '', usuario: '', acao: '', recurso: '' }
  useState<number>('auditoria-pagina', () => 1).value = 1
  useState<number>('auditoria-por-pagina', () => 20).value = 20
  useState<number>('auditoria-total', () => 0).value = 0
  useState('auditoria-kpis', () => ({ registros: 0, usuariosDistintos: 0, ultimaAtividade: null })).value = {
    registros: 0,
    usuariosDistintos: 0,
    ultimaAtividade: null
  }
  useState<string>('auditoria-busca', () => '').value = ''

  // RBAC do próprio usuário e cache das Configurações Globais
  useState('permissoes-usuario', () => ({})).value = {}
  useState('config-globais-cache', () => null).value = null
  useState('config-shell-cache', () => null).value = null
}