// Estado da página de Perfis de Acesso (RBAC) - fase 1 em memória (sem persistência,
// sem chamadas de rede). Núcleo conforme docs/02 §3.5 (tabelas `perfis`/`perfil_permissoes`):
// 4 ações booleanas fixas por módulo + 5 `permissoes_extras`. A matriz semeada é a única
// fonte das contagens exibidas na tela e do `docs/07` (design D2 da change em vigência).
import { computed } from 'vue'
import { useState } from '#app'
import { useUsuariosDemo } from '../usuarios/useUsuariosDemo'

export type SituacaoPerfil = 'Ativo' | 'Inativo' | 'Bloqueado'

/** Modo do modal de perfil - um componente, dois usos (mesmo contrato de ModoUsuario). */
export type ModoPerfis = 'novo' | 'editar'

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

export const MODULOS: { id: ModuloId; label: string; descricao: string }[] = [
  { id: 'manuais', label: 'Manuais', descricao: 'Manuais de produto e documentação técnica' },
  { id: 'release-week', label: 'Release Week', descricao: 'Notas de versão e divulgação de entregas' },
  { id: 'escopo-projetos', label: 'Escopo de Projetos', descricao: 'Projetos, escopo e acompanhamento de entregas' },
  { id: 'esteira-revisao', label: 'Esteira de Revisão', descricao: 'Fluxo de revisão e homologação de conteúdos' },
  { id: 'lancar-chamadas', label: 'Lançar as Chamadas', descricao: 'Chamadas e movimentos de negócio' },
  { id: 'parceiros', label: 'Parceiros', descricao: 'Cadastro e relacionamento de parceiros' },
  { id: 'softwares', label: 'Softwares', descricao: 'Catálogo de softwares e integrações' },
  { id: 'gestao-usuarios', label: 'Gestão de Usuários', descricao: 'Usuários, convites e acessos do sistema' },
  { id: 'perfis-acesso', label: 'Perfis de Acesso (RBAC)', descricao: 'Perfis de acesso e matriz de permissões' },
  { id: 'auditoria', label: 'Gestão de Auditoria', descricao: 'Trilha de auditoria e registros de atividade' },
  { id: 'configuracoes-globais', label: 'Configurações Globais', descricao: 'Ajustes globais do sistema' }
]

/** 99 = 11 módulos × 9 ações (4 fixas + 5 extras). */
export const PERMISSOES_POR_PERFIL = MODULOS.length * (ACOES.length + EXTRAS.length)

/** Espelho demo do registro `perfis` (docs/02 §3.5): identificador UUID, situação de 3
 *  estados e timestamps — sem `padrao_sistema`/`cor_identificacao` (colunas futuras). */
export interface PerfilDemo {
  id: string
  nome: PerfilId | string
  descricao: string
  situacao: SituacaoPerfil
  /** ISO 8601 - fixos na semente (evita divergência de hidratação cliente/servidor). */
  criado_em: string
  atualizado_em: string
  /** Matriz do perfil: módulo -> ações concedidas (fonte única das contagens). */
  permissoes: Record<ModuloId, Permissao[]>
}

export const VARIANTE_POR_STATUS: Record<SituacaoPerfil, 'done' | 'neutral' | 'blocked'> = {
  Ativo: 'done',
  Inativo: 'neutral',
  Bloqueado: 'blocked'
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

/** Matriz de um perfil recém-criado: 11 módulos sem nenhuma ação concedida (0/99). */
export const matrizVazia = (): Record<ModuloId, Permissao[]> => matriz({})

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

/**
 * Remove o perfil do id indicado (puro): devolve a base nova sem ele (a matriz de
 * permissões vai junto, pois vive no próprio objeto) e id inexistente devolve a base
 * intacta. Quem tem o `useState` é quem atribui `perfis.value = base` (mesmo contrato
 * de `excluirUsuario`).
 */
export const excluirPerfil = (
  base: PerfilDemo[],
  id: string
): { base: PerfilDemo[] } => ({
  base: base.filter((p) => p.id !== id)
})

/**
 * Grava o perfil no modo indicado (puro): criação gera `id` novo
 * (`crypto.randomUUID()`) e acrescenta clone ao fim da base; edição substitui o registro do
 * mesmo id (clone - `criado_em`/`atualizado_em` já resolvidos pelo chamador). Id
 * inexistente na edição devolve a base intacta.
 * Quem tem o `useState` é quem atribui `perfis.value = base` (mesmo contrato de
 * `excluirPerfil`).
 */
export const salvarPerfil = (
  base: PerfilDemo[],
  registro: PerfilDemo,
  modo: ModoPerfis
): { base: PerfilDemo[] } => {
  if (modo === 'novo') {
    return { base: [...base, clonar({ ...registro, id: crypto.randomUUID() })] }
  }
  return { base: base.map((p) => (p.id === registro.id ? clonar(registro) : p)) }
}

/**
 * Grava a matriz de permissões do perfil id (puro): devolve a base nova com o
 * registro clonado (matriz copiada célula a célula); id inexistente devolve a base
 * intacta. Mesmo contrato de `salvarPerfil` — quem tem o `useState` é quem atribui
 * `perfis.value = base`.
 */
export const salvarPermissoes = (
  base: PerfilDemo[],
  id: string,
  permissoes: Record<ModuloId, Permissao[]>
): { base: PerfilDemo[] } => ({
  base: base.map((p) => (p.id === id ? clonar({ ...p, permissoes }) : p))
})

// Base de demonstração - os 4 perfis canônicos (mesmos do PERFIS de useUsuariosDemo),
// todos Ativo: são os perfis em uso pelos 16 usuários da base (design D7).
// Timestamps fixos: nada de Date.now() no evaluate (hidratação cliente/servidor).
export const PERFIS_DEMO: PerfilDemo[] = [
  {
    id: 'p-001',
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema, incluindo perfis de acesso e configurações globais.',
    situacao: 'Ativo',
    criado_em: '2026-01-05T08:00:00.000Z',
    atualizado_em: '2026-01-05T08:00:00.000Z',
    permissoes: MATRIZ_SEED.Administrador
  },
  {
    id: 'p-002',
    nome: 'Editor',
    descricao: 'Produz, publica e mantém conteúdos e cadastros do portal.',
    situacao: 'Ativo',
    criado_em: '2026-01-05T08:00:00.000Z',
    atualizado_em: '2026-01-05T08:00:00.000Z',
    permissoes: MATRIZ_SEED.Editor
  },
  {
    id: 'p-003',
    nome: 'Revisor',
    descricao: 'Revisa e homologa conteúdos na esteira, sem criar nem excluir registros.',
    situacao: 'Ativo',
    criado_em: '2026-01-05T08:00:00.000Z',
    atualizado_em: '2026-01-05T08:00:00.000Z',
    permissoes: MATRIZ_SEED.Revisor
  },
  {
    id: 'p-004',
    nome: 'Leitor',
    descricao: 'Consulta e baixa os conteúdos publicados.',
    situacao: 'Ativo',
    criado_em: '2026-01-05T08:00:00.000Z',
    atualizado_em: '2026-01-05T08:00:00.000Z',
    permissoes: MATRIZ_SEED.Leitor
  }
]

/** Linha derivada da tabela: contagens nunca digitadas, sempre calculadas (design D2/D3). */
export interface LinhaPerfil {
  id: string
  nome: string
  descricao: string
  situacao: SituacaoPerfil
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
      situacao: perfil.situacao,
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
