// Estado da página de Escopo de Projetos (Área Administrativa) sobre a API
// `/api/escopo-projetos` (change escopo-projetos-backend-e-importacao). Lista,
// itens e escritas vêm do banco; filtros continuam em memória (client-side).
// Sem seed: a lista começa vazia e uma falha de API nunca inventa demonstração.
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  buscarEscopos,
  calcularKpis,
  filtrarEscopos,
  STATUS_ESCOPO,
  type DadosEscopo,
  type EntradaEscopo,
  type FiltrosEscopo,
  type ItemProjeto,
  type KpisEscopo,
  type ProjetoEscopoModelo
} from './validadores'

export * from './validadores'

export type ModoEscopo = 'novo' | 'editar'

const erro409 = (erro: unknown): string | undefined => {
  const e = erro as { statusMessage?: string; data?: { statusMessage?: string } } | null
  return e?.data?.statusMessage ?? e?.statusMessage
}

export const useEscopoProjetosModelo = () => {
  const escopos = useState<ProjetoEscopoModelo[]>('escopo-projetos-base', () => [])
  const carregando = useState<boolean>('escopo-projetos-carregando', () => false)
  const carregado = useState<boolean>('escopo-projetos-carregado', () => false)

  const itensPorProjeto = useState<Record<string, ItemProjeto[]>>(
    'escopo-projetos-itens',
    () => ({})
  )
  const itensCarregando = useState<Record<string, boolean>>(
    'escopo-projetos-itens-carregando',
    () => ({})
  )
  const itensErro = useState<Record<string, string | null>>(
    'escopo-projetos-itens-erro',
    () => ({})
  )

  const filtros = useState<FiltrosEscopo>('escopo-projetos-filtros', () => ({
    status: '',
    ano: '',
    versao: '',
    software: ''
  }))
  const busca = useState<string>('escopo-projetos-busca', () => '')

  const carregarEscopos = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<ProjetoEscopoModelo[]>('/api/escopo-projetos')
      escopos.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      escopos.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  const itensDoProjeto = (projetoId: string): ItemProjeto[] =>
    itensPorProjeto.value[projetoId] ?? []

  const carregarItens = async (projetoId: string, forcar = false): Promise<ItemProjeto[]> => {
    const atual = itensPorProjeto.value[projetoId]
    if (!forcar && atual) return atual
    if (itensCarregando.value[projetoId]) return atual ?? []
    itensCarregando.value = { ...itensCarregando.value, [projetoId]: true }
    itensErro.value = { ...itensErro.value, [projetoId]: null }
    try {
      const lista = await useApiFetch<ItemProjeto[]>(
        `/api/escopo-projetos/${projetoId}/itens`
      )
      itensPorProjeto.value = {
        ...itensPorProjeto.value,
        [projetoId]: Array.isArray(lista) ? lista : []
      }
      return itensPorProjeto.value[projetoId] ?? []
    } catch {
      itensErro.value = {
        ...itensErro.value,
        [projetoId]: 'Não foi possível carregar os itens deste escopo.'
      }
      itensPorProjeto.value = { ...itensPorProjeto.value, [projetoId]: [] }
      return []
    } finally {
      itensCarregando.value = { ...itensCarregando.value, [projetoId]: false }
    }
  }

  const escoposFiltrados = computed(() => filtrarEscopos(escopos.value, filtros.value))
  const escoposVisiveis = computed(() => buscarEscopos(escoposFiltrados.value, busca.value))
  const kpis = computed<KpisEscopo>(() => calcularKpis(escoposFiltrados.value))

  const filtrosAtivosCount = computed(
    () =>
      [filtros.value.status, filtros.value.ano, filtros.value.versao, filtros.value.software].filter(
        Boolean
      ).length
  )

  const opcoes = computed(() => {
    const ativos = escopos.value.filter((escopo) => !escopo.arquivada)
    const softwaresPresentes = new Set(
      ativos.flatMap((escopo) => escopo.softwaresContemplados).filter(Boolean)
    )
    return {
      status: [...STATUS_ESCOPO],
      anos: [...new Set(ativos.map((escopo) => String(escopo.ano)))].sort((a, b) =>
        b.localeCompare(a)
      ),
      versoes: [...new Set(ativos.map((escopo) => escopo.versao))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
      softwares: [...softwaresPresentes]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((nome) => ({ value: nome, label: nome }))
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', versao: '', software: '' }
  }

  // -------------------------------------------------------------------------
  // Escritas — pela API. Lançam FetchError (400/403/409) para o chamador
  // tratar; a lista local é atualizada com a resposta.
  // -------------------------------------------------------------------------

  const adicionar = async (dados: EntradaEscopo): Promise<ProjetoEscopoModelo> => {
    const criado = await useApiFetch<ProjetoEscopoModelo>('/api/escopo-projetos', {
      method: 'POST',
      body: dados
    })
    escopos.value = [criado, ...escopos.value]
    carregado.value = true
    return criado
  }

  const atualizar = async (
    id: string,
    dados: DadosEscopo
  ): Promise<ProjetoEscopoModelo | null> => {
    const atualizado = await useApiFetch<ProjetoEscopoModelo>(`/api/escopo-projetos/${id}`, {
      method: 'PUT',
      body: dados
    })
    escopos.value = escopos.value.map((escopo) => (escopo.id === id ? atualizado : escopo))
    return atualizado
  }

  const publicar = async (id: string): Promise<boolean> => {
    const publicado = await useApiFetch<ProjetoEscopoModelo>(
      `/api/escopo-projetos/${id}/publicar`,
      { method: 'PUT' }
    )
    escopos.value = escopos.value.map((escopo) => (escopo.id === id ? publicado : escopo))
    return true
  }

  const arquivar = async (id: string): Promise<boolean> => {
    await useApiFetch(`/api/escopo-projetos/${id}/arquivar`, { method: 'PUT' })
    escopos.value = escopos.value.filter((escopo) => escopo.id !== id)
    return true
  }

  const excluir = async (id: string): Promise<{ ok: boolean; motivo?: string }> => {
    try {
      await useApiFetch(`/api/escopo-projetos/${id}`, { method: 'DELETE' })
      escopos.value = escopos.value.filter((escopo) => escopo.id !== id)
      const { [id]: _removido, ...resto } = itensPorProjeto.value
      itensPorProjeto.value = resto
      return { ok: true }
    } catch (erro) {
      return { ok: false, motivo: erro409(erro) ?? 'Não foi possível excluir o escopo.' }
    }
  }

  const importar = async (
    linhas: Array<Record<string, unknown>>
  ): Promise<{ importados: number }> => {
    const resultado = await useApiFetch<{ importados: number }>(
      '/api/escopo-projetos/importar',
      { method: 'POST', body: { linhas } }
    )
    await carregarEscopos(true)
    return resultado
  }

  return {
    escopos,
    carregando,
    carregado,
    carregarEscopos,
    itensPorProjeto,
    itensCarregando,
    itensErro,
    itensDoProjeto,
    carregarItens,
    filtros,
    busca,
    escoposFiltrados,
    escoposVisiveis,
    kpis,
    filtrosAtivosCount,
    opcoes,
    limparFiltros,
    adicionar,
    atualizar,
    publicar,
    arquivar,
    excluir,
    importar
  }
}
