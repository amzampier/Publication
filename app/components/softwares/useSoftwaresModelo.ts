// Estado da página de Softwares (Área Administrativa) sobre a API /api/softwares
// (changes construir-softwares-frontend e softwares-backend-e-importacao). O
// `codigo` (SFT-XXX) é a identidade do software; é gerado pelo servidor na
// inclusão/importação e nunca digitado. Sem resposta, a lista fica VAZIA com
// erro — nunca uma base de demonstração fingindo ser persistida (RL02 DIV-12/13).
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'

export type CategoriaSoftware = 'Delphi' | 'Web' | 'Delphi e Web'
export type SituacaoSoftware = 'Ativo' | 'Inativo'

/** Registro do software no shape do contrato da API. */
export interface SoftwareModelo {
  codigo: string
  descricao: string
  categoria: CategoriaSoftware
  situacao: SituacaoSoftware
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
}

/** Domínio de categoria (ordem do enum do banco) — opções de exibição/filtro. */
export const CATEGORIAS: CategoriaSoftware[] = ['Delphi', 'Web', 'Delphi e Web']
/** Domínio de situação (ordem do enum do banco). */
export const SITUACOES: SituacaoSoftware[] = ['Ativo', 'Inativo']

/** Variante do UiBadge por situação (Ativo→verde, Inativo→neutro). */
export const VARIANTE_POR_SITUACAO: Record<SituacaoSoftware, 'done' | 'neutral'> = {
  Ativo: 'done',
  Inativo: 'neutral'
}

export interface FiltrosSoftwares {
  /** '' = todas; valor é a categoria */
  categoria: string
  /** '' = todas */
  situacao: string
}

/** Linha derivada da tabela: timestamps já formatados em pt-BR. */
export interface LinhaSoftware {
  codigo: string
  descricao: string
  categoria: CategoriaSoftware
  situacao: SituacaoSoftware
  criadoEm: string
  atualizadoEm: string
}

/** Modo do modal de software — um componente, dois usos (mesmo contrato de ModoPerfis). */
export type ModoSoftwares = 'novo' | 'editar'

/** Formata um timestamp ISO em `dd/mm/aaaa hh:mm` (pt-BR); devolve o original se inválido. */
export const formatarDataHora = (iso: string): string => {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// ---------------------------------------------------------------------------
// Escritas — pela API. Assíncronas; em erro lançam (FetchError com `statusCode`
// — o chamador trata 400/409 e demais códigos).
// ---------------------------------------------------------------------------

/** Cria (POST) ou edita (PUT) o software; devolve a base com a resposta do servidor. */
export const salvarSoftware = async (
  base: SoftwareModelo[],
  registro: SoftwareModelo,
  modo: ModoSoftwares
): Promise<{ base: SoftwareModelo[] }> => {
  const corpo = {
    descricao: registro.descricao,
    categoria: registro.categoria,
    situacao: registro.situacao
  }
  if (modo === 'novo') {
    const criado = await useApiFetch<SoftwareModelo>('/api/softwares', {
      method: 'POST',
      body: corpo
    })
    return { base: [...base, criado] }
  }
  const atualizado = await useApiFetch<SoftwareModelo>(`/api/softwares/${registro.codigo}`, {
    method: 'PUT',
    body: corpo
  })
  return { base: base.map((s) => (s.codigo === registro.codigo ? atualizado : s)) }
}

/** Exclui o software (DELETE) e devolve a base sem o registro. */
export const excluirSoftware = async (
  base: SoftwareModelo[],
  codigo: string
): Promise<{ base: SoftwareModelo[] }> => {
  await useApiFetch(`/api/softwares/${codigo}`, { method: 'DELETE' })
  return { base: base.filter((s) => s.codigo !== codigo) }
}

/** Importa as linhas validadas (POST) — os códigos são atribuídos pelo servidor. */
export const importarSoftwares = async (
  registros: Array<{ descricao: string; categoria: string; situacao: string }>
): Promise<{ importados: number }> => {
  return await useApiFetch<{ importados: number }>('/api/softwares/importar', {
    method: 'POST',
    body: { linhas: registros }
  })
}

export const useSoftwaresModelo = () => {
  // Base reativa compartilhada: inicia VAZIA (a carga preenche com o banco —
  // spec: nunca exibir a demo como se fosse persistida).
  const softwares = useState<SoftwareModelo[]>('softwares-base', () => [])
  const carregando = useState<boolean>('softwares-carregando', () => false)
  const carregado = useState<boolean>('softwares-carregado', () => false)

  /**
   * Hidrata a base a partir de GET /api/softwares. `forcar` refaz a leitura
   * (usado após gravar/importar). Devolve `false` quando a carga falha — o
   * chamador mostra o toast de erro e a lista permanece vazia.
   */
  const carregarSoftwares = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<SoftwareModelo[]>('/api/softwares')
      softwares.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      softwares.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  // Filtros estruturais (spec softwares: o modal de filtros refina o conjunto
  // vigente) — em memória, descartados na recarga.
  const filtros = useState<FiltrosSoftwares>('softwares-filtros', () => ({
    categoria: '',
    situacao: ''
  }))

  const softwaresFiltrados = computed<SoftwareModelo[]>(() => {
    const f = filtros.value
    return softwares.value.filter((s) => {
      if (f.categoria && s.categoria !== f.categoria) return false
      if (f.situacao && s.situacao !== f.situacao) return false
      return true
    })
  })

  const filtrosAtivosCount = computed(
    () => [!!filtros.value.categoria, !!filtros.value.situacao].filter(Boolean).length
  )

  const limparFiltros = () => {
    filtros.value = { categoria: '', situacao: '' }
  }

  // Opções dos UiSelect dos filtros — o estado vazio ('') é representado pelo
  // placeholder ("Todas") e o X do select (clearable) devolve o filtro a "todas".
  const opcoes = computed(() => ({
    categorias: [...CATEGORIAS],
    situacoes: [...SITUACOES]
  }))

  const linhas = computed<LinhaSoftware[]>(() =>
    softwaresFiltrados.value.map((s) => ({
      codigo: s.codigo,
      descricao: s.descricao,
      categoria: s.categoria,
      situacao: s.situacao,
      criadoEm: formatarDataHora(s.criado_em),
      atualizadoEm: formatarDataHora(s.atualizado_em)
    }))
  )

  // KPIs — derivam do conjunto VIGENTE (recalculam quando um filtro o refina).
  const total = computed(() => softwaresFiltrados.value.length)
  const ativos = computed(
    () => softwaresFiltrados.value.filter((s) => s.situacao === 'Ativo').length
  )
  const inativos = computed(
    () => softwaresFiltrados.value.filter((s) => s.situacao === 'Inativo').length
  )
  const porCategoria = computed<Record<CategoriaSoftware, number>>(() => {
    const contagem = { Delphi: 0, Web: 0, 'Delphi e Web': 0 } as Record<CategoriaSoftware, number>
    for (const s of softwaresFiltrados.value) {
      if (contagem[s.categoria] !== undefined) contagem[s.categoria] += 1
    }
    return contagem
  })

  return {
    softwares,
    carregando,
    carregado,
    carregarSoftwares,
    filtros,
    softwaresFiltrados,
    filtrosAtivosCount,
    limparFiltros,
    opcoes,
    linhas,
    total,
    ativos,
    inativos,
    porCategoria
  }
}
