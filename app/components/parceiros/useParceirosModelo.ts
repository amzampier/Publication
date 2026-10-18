// Estado da página de Parceiros (Área Administrativa) sobre a API
// /api/parceiros (change construir-parceiros). O `id` (UUID) é a chave; o
// `codigo` (PAR-XXX) é um identificador secundário gerado pelo servidor e nunca
// digitado. A `regiao` é derivada da UF. Sem resposta, a lista fica VAZIA com
// erro — nunca uma base de demonstração fingindo ser persistida.
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import { REGIOES, UFS, type OpcaoSelect } from '../../config/brasil'

export type SituacaoParceiro = 'Ativo' | 'Inativo' | 'Bloqueado'
export type RegiaoBR = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

/** Registro do parceiro no shape do contrato da API. */
export interface ParceiroModelo {
  id: string
  codigo: string
  razao_social: string
  nome_fantasia: string
  cidade: string
  estado: string
  regiao: RegiaoBR | ''
  logo_url: string
  situacao: SituacaoParceiro
  /** ISO 8601 */
  criado_em: string
  /** ISO 8601 */
  atualizado_em: string
}

/** Domínio de situação (ordem do enum do banco). */
export const SITUACOES: SituacaoParceiro[] = ['Ativo', 'Inativo', 'Bloqueado']
/** As 5 regiões do Brasil (ordem canônica). */
export const REGIOES_BR: RegiaoBR[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

/** Variante do UiBadge por situação (Ativo→verde, Inativo→neutro, Bloqueado→vermelho). */
export const VARIANTE_POR_SITUACAO: Record<SituacaoParceiro, 'done' | 'neutral' | 'blocked'> = {
  Ativo: 'done',
  Inativo: 'neutral',
  Bloqueado: 'blocked'
}

export interface FiltrosParceiros {
  /** '' = todas */
  situacao: string
  /** '' = todas */
  regiao: string
  /** '' = todos */
  estado: string
}

/** Modo do modal de parceiro — um componente, dois usos. */
export type ModoParceiros = 'novo' | 'editar'

/** Formata um timestamp ISO em `dd/mm/aaaa hh:mm` (pt-BR); devolve o original se inválido. */
export const formatarDataHora = (iso: string): string => {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// ---------------------------------------------------------------------------
// Escritas — pela API. Assíncronas; em erro lançam (FetchError com `statusCode`).
// ---------------------------------------------------------------------------

/**
 * Envia uma dataURL (upload/câmera) para o destino 'logos' e devolve a URL do
 * arquivo gravado — o registro guarda só o caminho (logo_url).
 */
export async function enviarLogo(dataUrl: string): Promise<string> {
  const partes = dataUrl.split(',')
  const meta = partes[0] ?? ''
  const dados = partes[1] ?? ''
  const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/png'
  const extensao = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png'
  const binario = atob(dados)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)

  const form = new FormData()
  form.append('pasta', 'logos')
  form.append('file', new Blob([bytes], { type: mime }), `logo.${extensao}`)
  const resp = await useApiFetch<{ url: string }>('/api/uploads', { method: 'POST', body: form })
  return resp.url
}

/** Cria (POST) ou edita (PUT) o parceiro; a logo dataURL vira arquivo antes. */
export const salvarParceiro = async (
  base: ParceiroModelo[],
  registro: ParceiroModelo,
  modo: ModoParceiros
): Promise<{ base: ParceiroModelo[] }> => {
  let logo = registro.logo_url
  if (logo.startsWith('data:')) logo = await enviarLogo(logo)

  const corpo = {
    razao_social: registro.razao_social,
    nome_fantasia: registro.nome_fantasia,
    cidade: registro.cidade,
    estado: registro.estado,
    regiao: registro.regiao,
    logo_url: logo,
    situacao: registro.situacao
  }
  if (modo === 'novo') {
    const criado = await useApiFetch<ParceiroModelo>('/api/parceiros', { method: 'POST', body: corpo })
    return { base: [...base, criado] }
  }
  const atualizado = await useApiFetch<ParceiroModelo>(`/api/parceiros/${registro.id}`, {
    method: 'PUT',
    body: corpo
  })
  return { base: base.map((p) => (p.id === registro.id ? atualizado : p)) }
}

/** Exclui o parceiro (DELETE) e devolve a base sem o registro. */
export const excluirParceiro = async (
  base: ParceiroModelo[],
  id: string
): Promise<{ base: ParceiroModelo[] }> => {
  await useApiFetch(`/api/parceiros/${id}`, { method: 'DELETE' })
  return { base: base.filter((p) => p.id !== id) }
}

/** Importa as linhas validadas (POST) — os códigos são atribuídos pelo servidor. */
export const importarParceiros = async (
  registros: Array<{
    razao_social: string
    nome_fantasia: string
    cidade: string
    estado: string
    regiao: string
    situacao: string
  }>
): Promise<{ importados: number }> => {
  return await useApiFetch<{ importados: number }>('/api/parceiros/importar', {
    method: 'POST',
    body: { linhas: registros }
  })
}

export const useParceirosModelo = () => {
  // Base reativa compartilhada: inicia VAZIA (a carga preenche com o banco).
  const parceiros = useState<ParceiroModelo[]>('parceiros-base', () => [])
  const carregando = useState<boolean>('parceiros-carregando', () => false)
  const carregado = useState<boolean>('parceiros-carregado', () => false)

  /**
   * Hidrata a base a partir de GET /api/parceiros. `forcar` refaz a leitura
   * (usado após gravar/importar). Devolve `false` quando a carga falha.
   */
  const carregarParceiros = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<ParceiroModelo[]>('/api/parceiros')
      parceiros.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      parceiros.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  // Filtros estruturais — em memória, descartados na recarga.
  const filtros = useState<FiltrosParceiros>('parceiros-filtros', () => ({
    situacao: '',
    regiao: '',
    estado: ''
  }))

  // Busca textual (client-side) aplicada sobre o conjunto filtrado.
  const busca = useState<string>('parceiros-busca', () => '')

  const parceirosFiltrados = computed<ParceiroModelo[]>(() => {
    const f = filtros.value
    return parceiros.value.filter((p) => {
      if (f.situacao && p.situacao !== f.situacao) return false
      if (f.regiao && p.regiao !== f.regiao) return false
      if (f.estado && p.estado !== f.estado) return false
      return true
    })
  })

  const parceirosVisiveis = computed<ParceiroModelo[]>(() => {
    const termo = busca.value.trim().toLowerCase()
    if (!termo) return parceirosFiltrados.value
    return parceirosFiltrados.value.filter((p) =>
      [p.codigo, p.razao_social, p.nome_fantasia, p.cidade, p.estado, p.regiao]
        .join(' ')
        .toLowerCase()
        .includes(termo)
    )
  })

  const filtrosAtivosCount = computed(
    () =>
      [!!filtros.value.situacao, !!filtros.value.regiao, !!filtros.value.estado].filter(Boolean)
        .length
  )

  const limparFiltros = () => {
    filtros.value = { situacao: '', regiao: '', estado: '' }
  }

  // KPIs — derivam do conjunto VIGENTE (filtrado, quando houver filtro).
  const total = computed(() => parceirosFiltrados.value.length)
  const ativos = computed(() => parceirosFiltrados.value.filter((p) => p.situacao === 'Ativo').length)
  const inativos = computed(
    () => parceirosFiltrados.value.filter((p) => p.situacao === 'Inativo').length
  )
  const bloqueados = computed(
    () => parceirosFiltrados.value.filter((p) => p.situacao === 'Bloqueado').length
  )

  // Opções dos selects de filtro (situação e região são domínio; estado é a UF).
  const opcoes = computed(() => ({
    situacoes: SITUACOES.map((s) => ({ value: s, label: s })) as OpcaoSelect[],
    regioes: REGIOES.map((r) => ({ value: r.value, label: r.label })) as OpcaoSelect[],
    estados: UFS
  }))

  return {
    parceiros,
    carregando,
    carregado,
    carregarParceiros,
    filtros,
    filtrosAtivosCount,
    limparFiltros,
    busca,
    parceirosFiltrados,
    parceirosVisiveis,
    total,
    ativos,
    inativos,
    bloqueados,
    opcoes
  }
}
