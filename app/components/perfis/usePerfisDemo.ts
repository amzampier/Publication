// Estado da página de Perfis de Acesso (RBAC) - fase 1 em memória (sem persistência,
// sem chamadas de rede). Núcleo conforme docs/02 §3.5 (tabelas `perfis`/`perfil_permissoes`):
// 4 ações booleanas fixas por módulo + 5 `permissoes_extras`. A matriz semeada é a única
// fonte das contagens exibidas na tela e do `docs/07` (design D2 da change em vigência).
import { computed } from 'vue'
import { useState } from '#app'
import { useUsuariosDemo } from '../usuarios/useUsuariosDemo'

export type StatusPerfil = 'Ativo' | 'Inativo'

export type PerfilId = 'Administrador' | 'Editor' | 'Revisor' | 'Leitor'

export type ModuloId =
  | 'manuais'
  | 'release-week'
  | 'escopo-projetos'
  | 'esteira-revisao'
  | 'lancar-chamadas'
  | 'parceiros'
  | 'softwares'
  | 'gestao-usuarios'
  | 'perfis-acesso'
  | 'auditoria'
  | 'configuracoes-globais'

/** Ações fixas do `perfil_permissoes` (docs/02 §3.5). */
export type Acao = 'visualizar' | 'criar' | 'alterar' | 'excluir'
/** Ações especiais do `permissoes_extras` JSON (docs/02 §3.5). */
export type Extra = 'publicar' | 'arquivar' | 'download' | 'exportar' | 'importar'
export type Permissao = Acao | Extra

export const ACOES: Acao[] = ['visualizar', 'criar', 'alterar', 'excluir']
export const EXTRAS: Extra[] = ['publicar', 'arquivar', 'download', 'exportar', 'importar']

export const MODULOS: { id: ModuloId; label: string }[] = [
  { id: 'manuais', label: 'Manuais' },
  { id: 'release-week', label: 'Release Week' },
  { id: 'escopo-projetos', label: 'Escopo de Projetos' },
  { id: 'esteira-revisao', label: 'Esteira de Revisão' },
  { id: 'lancar-chamadas', label: 'Lançar as Chamadas' },
  { id: 'parceiros', label: 'Parceiros' },
  { id: 'softwares', label: 'Softwares' },
  { id: 'gestao-usuarios', label: 'Gestão de Usuários' },
  { id: 'perfis-acesso', label: 'Perfis de Acesso (RBAC)' },
  { id: 'auditoria', label: 'Gestão de Auditoria' },
  { id: 'configuracoes-globais', label: 'Configurações Globais' }
]

/** 99 = 11 módulos × 9 ações (4 fixas + 5 extras). */
export const PERMISSOES_POR_PERFIL = MODULOS.length * (ACOES.length + EXTRAS.length)

export interface PerfilDemo {
  id: string
  nome: PerfilId
  descricao: string
  status: StatusPerfil
  /** Matriz do perfil: módulo -> ações concedidas (fonte única das contagens). */
  permissoes: Record<ModuloId, Permissao[]>
}

export const VARIANTE_POR_STATUS: Record<StatusPerfil, 'done' | 'neutral'> = {
  Ativo: 'done',
  Inativo: 'neutral'
}

// Regras por perfil (docs/07 §"Matriz de permissões"; design D2) - conjuntos declarados
// uma única vez e reutilizados pelos módulos do mesmo grupo.
const ACOES_TUDO: Permissao[] = [...ACOES, ...EXTRAS]
const CONTEIDO_EDITOR: Permissao[] = [
  'visualizar',
  'criar',
  'alterar',
  'publicar',
  'arquivar',
  'download',
  'exportar'
]
const CONTEIDO_REVISOR: Permissao[] = ['visualizar', 'alterar', 'download', 'exportar']
const CONTEIDO_LEITOR: Permissao[] = ['visualizar', 'download']

/** Garante os 11 módulos em toda matriz, copiando cada lista (sem referência compartilhada). */
const matriz = (parcial: Partial<Record<ModuloId, Permissao[]>>): Record<ModuloId, Permissao[]> => {
  const completa = {} as Record<ModuloId, Permissao[]>
  for (const modulo of MODULOS) completa[modulo.id] = [...(parcial[modulo.id] ?? [])]
  return completa
}

const conteudo = (acoes: Permissao[]): Partial<Record<ModuloId, Permissao[]>> => ({
  manuais: acoes,
  'release-week': acoes,
  'escopo-projetos': acoes
})

export const MATRIZ_SEED: Record<PerfilId, Record<ModuloId, Permissao[]>> = {
  Administrador: matriz(
    Object.fromEntries(MODULOS.map((m) => [m.id, ACOES_TUDO])) as Partial<
      Record<ModuloId, Permissao[]>
    >
  ),
  Editor: matriz({
    ...conteudo(CONTEIDO_EDITOR),
    'esteira-revisao': ['visualizar', 'criar', 'alterar', 'publicar', 'arquivar'],
    'lancar-chamadas': ['visualizar', 'criar', 'alterar', 'publicar', 'arquivar', 'download'],
    parceiros: ['visualizar', 'criar', 'alterar', 'exportar'],
    softwares: ['visualizar', 'criar', 'alterar', 'exportar'],
    'gestao-usuarios': ['visualizar', 'importar', 'exportar'],
    auditoria: ['visualizar', 'exportar']
  }),
  Revisor: matriz({
    ...conteudo(CONTEIDO_REVISOR),
    'esteira-revisao': ['visualizar', 'alterar'],
    'lancar-chamadas': ['visualizar', 'alterar'],
    parceiros: ['visualizar'],
    softwares: ['visualizar'],
    'gestao-usuarios': ['visualizar'],
    auditoria: ['visualizar', 'exportar']
  }),
  Leitor: matriz(conteudo(CONTEIDO_LEITOR))
}

export const contarPermissoes = (perfil: PerfilDemo): number =>
  MODULOS.reduce((total, modulo) => total + (perfil.permissoes[modulo.id]?.length ?? 0), 0)

const clonar = (p: PerfilDemo): PerfilDemo => ({
  ...p,
  permissoes: Object.fromEntries(
    MODULOS.map((m) => [m.id, [...(p.permissoes[m.id] ?? [])]])
  ) as Record<ModuloId, Permissao[]>
})

// Base de demonstração - os 4 perfis canônicos (mesmos do PERFIS de useUsuariosDemo),
// todos Ativo: são os perfis em uso pelos 16 usuários da base (design D7).
export const PERFIS_DEMO: PerfilDemo[] = [
  {
    id: 'p-001',
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema, incluindo perfis de acesso e configurações globais.',
    status: 'Ativo',
    permissoes: MATRIZ_SEED.Administrador
  },
  {
    id: 'p-002',
    nome: 'Editor',
    descricao: 'Produz, publica e mantém conteúdos e cadastros do portal.',
    status: 'Ativo',
    permissoes: MATRIZ_SEED.Editor
  },
  {
    id: 'p-003',
    nome: 'Revisor',
    descricao: 'Revisa e homologa conteúdos na esteira, sem criar nem excluir registros.',
    status: 'Ativo',
    permissoes: MATRIZ_SEED.Revisor
  },
  {
    id: 'p-004',
    nome: 'Leitor',
    descricao: 'Consulta e baixa os conteúdos publicados.',
    status: 'Ativo',
    permissoes: MATRIZ_SEED.Leitor
  }
]

/** Linha derivada da tabela: contagens nunca digitadas, sempre calculadas (design D2/D3). */
export interface LinhaPerfil {
  id: string
  nome: PerfilId
  descricao: string
  status: StatusPerfil
  usuarios: number
  permissoesTexto: string
}

export const usePerfisDemo = () => {
  // Base reativa (fase 1): criada na carga, perdida na recarga. Clone da semente.
  const perfis = useState<PerfilDemo[]>('perfis-base', () => PERFIS_DEMO.map(clonar))

  // Contagem de usuários por perfil deriva da base vigente de usuários (design D3):
  // criar/excluir um usuário em /admin/gestao-usuarios acompanha aqui, sem reload.
  const { usuarios } = useUsuariosDemo()

  const usuariosPorPerfil = computed<Record<string, number>>(() => {
    const contagem: Record<string, number> = {}
    for (const perfil of perfis.value) contagem[perfil.nome] = 0
    for (const usuario of usuarios.value) {
      if (usuario.perfil in contagem) contagem[usuario.perfil] += 1
    }
    return contagem
  })

  const linhas = computed<LinhaPerfil[]>(() =>
    perfis.value.map((perfil) => ({
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      status: perfil.status,
      usuarios: usuariosPorPerfil.value[perfil.nome] ?? 0,
      permissoesTexto: `${contarPermissoes(perfil)}/${PERMISSOES_POR_PERFIL}`
    }))
  )

  const totalPermissoesConcedidas = computed(() =>
    perfis.value.reduce((total, perfil) => total + contarPermissoes(perfil), 0)
  )

  const totalPermissoesPossiveis = computed(() => perfis.value.length * PERMISSOES_POR_PERFIL)

  return {
    perfis,
    linhas,
    usuariosPorPerfil,
    totalPermissoesConcedidas,
    totalPermissoesPossiveis
  }
}
