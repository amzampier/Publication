// Estado da página de Perfis de Acesso (RBAC) sobre a API /api/perfis
// (change perfis-acesso-backend — spec perfis-acesso). O contrato público é o da
// fase 1 (mesmos nomes/tipos), mas a base vem do banco (`GET /api/perfis`), as
// gravações são assíncronas e nada é semeado em memória: sem resposta, a lista
// fica vazia com erro — nunca a demo fingindo ser real.
// Núcleo do modelo conforme docs/02 §3.5 (perfis_acesso/permissoes_perfil):
// 4 ações booleanas fixas por módulo + extras (JSON) — total do catálogo (88).
// Os ids de módulo/ações estão duplicados em server/utils/perfis.ts (barreira
// app/ × server/) — mantenha os dois lados em sincronia.
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import { FUNCIONALIDADES_POR_MODULO } from '../../config/perfis'

export { FUNCIONALIDADES_POR_MODULO }

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

/** Ações fixas do `permissoes_perfil` (docs/02 §3.5). */
export type Acao = 'visualizar' | 'criar' | 'alterar' | 'excluir'
/** Funcionalidades específicas do `extras` JSON (docs/02 §3.5). */
export type Extra =
  | 'publicar'
  | 'arquivar'
  | 'download'
  | 'exportar'
  | 'importar'
  | 'filtrar'
  | 'buscar'
  | 'permissoes'
  | 'convite'
  | 'clonar'
  | 'visualizar_itens'
export type Permissao = Acao | Extra

export const ACOES: Acao[] = ['visualizar', 'criar', 'alterar', 'excluir']
export const EXTRAS: Extra[] = [
  'publicar',
  'arquivar',
  'download',
  'exportar',
  'importar',
  'filtrar',
  'buscar',
  'permissoes',
  'convite',
  'clonar',
  'visualizar_itens'
]

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

/**
 * Catálogo de funcionalidades POR MÓDULO (fonte única da matriz): definido em
 * app/config/perfis.ts (parte pura, espelho de server/utils/perfis.ts — teste
 * tests/perfis-funcionalidades.test.ts).
 */

/** Total de funcionalidades do catálogo (soma dos módulos) — 83 nos 11 módulos atuais. */
export const PERMISSOES_POR_PERFIL = MODULOS.reduce(
  (soma, m) => soma + (FUNCIONALIDADES_POR_MODULO[m.id]?.length ?? 0),
  0
)

/** Registro do perfil no shape da API (espelho do PerfilModelo da fase 1). */
export interface PerfilModelo {
  id: string
  nome: PerfilId | string
  descricao: string
  situacao: SituacaoPerfil
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
  /** Usuários vinculados — derivado da tabela `usuarios` pelo servidor. */
  usuarios: number
  /** Matriz do perfil: módulo -> ações concedidas (fonte única das contagens). */
  permissoes: Record<ModuloId, Permissao[]>
}

export const VARIANTE_POR_STATUS: Record<SituacaoPerfil, 'done' | 'neutral' | 'blocked'> = {
  Ativo: 'done',
  Inativo: 'neutral',
  Bloqueado: 'blocked'
}

/** Opções do select de Status do modal de filtros (na ordem do enum). */
export const SITUACOES: SituacaoPerfil[] = ['Ativo', 'Inativo', 'Bloqueado']

export interface FiltrosPerfis {
  /** '' = todos; valor é o `nome` do perfil */
  perfil: string
  /** '' = todos */
  situacao: string
}

/** Garante os 11 módulos em toda matriz, copiando cada lista (sem referência compartilhada). */
const matriz = (parcial: Partial<Record<ModuloId, Permissao[]>>): Record<ModuloId, Permissao[]> => {
  const completa = {} as Record<ModuloId, Permissao[]>
  for (const modulo of MODULOS) completa[modulo.id] = [...(parcial[modulo.id] ?? [])]
  return completa
}

/** Clone de matriz completa: 11 módulos com listas novas (sem referência compartilhada). */
export const clonarMatriz = (
  origem: Record<ModuloId, Permissao[]>
): Record<ModuloId, Permissao[]> => matriz(origem)

/** Matriz de um perfil sem nenhuma ação concedida (0/99) — criação nova e rascunho vazio. */
export const matrizVazia = (): Record<ModuloId, Permissao[]> => matriz({})

export const contarPermissoes = (perfil: PerfilModelo): number =>
  MODULOS.reduce((total, modulo) => total + (perfil.permissoes[modulo.id]?.length ?? 0), 0)

// ---------------------------------------------------------------------------
// Escritas — 100% pela API (spec perfis-acesso: gravam no banco e sobrevivem
// à recarga). Assíncronas; em erro lançam (FetchError com `statusCode` — o
// chamador trata 409 de vínculo e demais códigos).
// ---------------------------------------------------------------------------

/** Cria (POST) ou edita (PUT) o perfil; devolve a base com a resposta do servidor. */
export const salvarPerfil = async (
  base: PerfilModelo[],
  registro: PerfilModelo,
  modo: ModoPerfis
): Promise<{ base: PerfilModelo[] }> => {
  const corpo = {
    nome: registro.nome,
    descricao: registro.descricao,
    situacao: registro.situacao
  }
  if (modo === 'novo') {
    const criado = await useApiFetch<PerfilModelo>('/api/perfis', {
      method: 'POST',
      body: corpo
    })
    return { base: [...base, criado] }
  }
  const atualizado = await useApiFetch<PerfilModelo>(`/api/perfis/${registro.id}`, {
    method: 'PUT',
    body: corpo
  })
  return { base: base.map((p) => (p.id === registro.id ? atualizado : p)) }
}

/** Grava a matriz inteira do perfil (PUT .../permissoes) e devolve a base atualizada. */
export const salvarPermissoes = async (
  base: PerfilModelo[],
  id: string,
  permissoes: Record<ModuloId, Permissao[]>
): Promise<{ base: PerfilModelo[] }> => {
  const atualizado = await useApiFetch<PerfilModelo>(`/api/perfis/${id}/permissoes`, {
    method: 'PUT',
    body: { permissoes }
  })
  return { base: base.map((p) => (p.id === id ? atualizado : p)) }
}

/**
 * Exclui o perfil (DELETE). Lança com `statusCode` 409 quando o servidor encontra
 * usuários vinculados (o chamador exibe o toast de bloqueio e mantém a base).
 */
export const excluirPerfil = async (
  base: PerfilModelo[],
  id: string
): Promise<{ base: PerfilModelo[] }> => {
  await useApiFetch(`/api/perfis/${id}`, { method: 'DELETE' })
  return { base: base.filter((p) => p.id !== id) }
}

/**
 * Copia a matriz SALVA do perfil origem para o destino (POST .../copiar) — gravação
 * imediata no servidor, nunca o rascunho do cliente. Devolve a base com o destino
 * atualizado.
 */
export const copiarMatrizPara = async (
  base: PerfilModelo[],
  origemId: string,
  destinoId: string
): Promise<{ base: PerfilModelo[] }> => {
  const destino = await useApiFetch<PerfilModelo>(
    `/api/perfis/${origemId}/permissoes/copiar`,
    { method: 'POST', body: { destino_id: destinoId } }
  )
  return { base: base.map((p) => (p.id === destinoId ? destino : p)) }
}

/** Linha derivada da tabela: contagens nunca digitadas, sempre calculadas (design D2/D3). */
export interface LinhaPerfil {
  id: string
  nome: string
  descricao: string
  situacao: SituacaoPerfil
  usuarios: number
  permissoesTexto: string
}

export const usePerfisModelo = () => {
  // Base reativa compartilhada: inicia VAZIA (a carga preenche com o banco —
  // spec: nunca exibir a demo como se fosse persistida).
  const perfis = useState<PerfilModelo[]>('perfis-base', () => [])
  const carregando = useState<boolean>('perfis-carregando', () => false)
  const carregado = useState<boolean>('perfis-carregado', () => false)

  /**
   * Hidrata a base a partir de GET /api/perfis (idempotente: só busca na primeira
   * montagem ou após falha). Devolve `false` quando a carga falha — o chamador
   * mostra o toast de erro e a lista permanece vazia.
   */
  const carregarPerfis = async (): Promise<boolean> => {
    if (carregado.value) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<PerfilModelo[]>('/api/perfis')
      perfis.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      perfis.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  // Filtros estruturais (spec perfis-acesso: modal de filtros refina o conjunto
  // vigente) — em memória, descartados na recarga (mesmo contrato de usuarios).
  const filtros = useState<FiltrosPerfis>('perfis-filtros', () => ({
    perfil: '',
    situacao: ''
  }))

  const perfisFiltrados = computed<PerfilModelo[]>(() => {
    const f = filtros.value
    return perfis.value.filter((p) => {
      if (f.perfil && p.nome !== f.perfil) return false
      if (f.situacao && p.situacao !== f.situacao) return false
      return true
    })
  })

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.perfil, !!f.situacao].filter(Boolean).length
  })

  // Opções do select de Perfil derivam da BASE (não do conjunto filtrado): um
  // filtro de Status não pode esconder opções do select de Perfil (espelho da
  // regra de opcoesUsuarios de useUsuariosModelo).
  const opcoesPerfis = computed(() =>
    perfis.value.map((p) => p.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )

  const limparFiltros = () => {
    filtros.value = { perfil: '', situacao: '' }
  }

  // Contagem de usuários por perfil deriva do campo `usuarios` vindo da API
  // (COUNT sobre a tabela usuarios — D4 do design): editar usuários no sistema
  // reflete na próxima carga da página (spec: "Acompanha a base de usuários").
  // Incide sobre o CONJUNTO FILTRADO (KPIs/linhas seguem o filtro — spec).
  const usuariosPorPerfil = computed<Record<string, number>>(() => {
    const contagem: Record<string, number> = {}
    for (const perfil of perfisFiltrados.value) contagem[perfil.nome] = perfil.usuarios
    return contagem
  })

  const linhas = computed<LinhaPerfil[]>(() =>
    perfisFiltrados.value.map((perfil) => ({
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      situacao: perfil.situacao,
      usuarios: perfil.usuarios,
      permissoesTexto: `${contarPermissoes(perfil)}/${PERMISSOES_POR_PERFIL}`
    }))
  )

  const totalPermissoesConcedidas = computed(() =>
    perfisFiltrados.value.reduce((total, perfil) => total + contarPermissoes(perfil), 0)
  )

  const totalPermissoesPossiveis = computed(
    () => perfisFiltrados.value.length * PERMISSOES_POR_PERFIL
  )

  return {
    perfis,
    carregando,
    carregado,
    carregarPerfis,
    filtros,
    perfisFiltrados,
    filtrosAtivosCount,
    opcoesPerfis,
    limparFiltros,
    linhas,
    usuariosPorPerfil,
    totalPermissoesConcedidas,
    totalPermissoesPossiveis
  }
}
