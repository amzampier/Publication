// Estado da página de Release Week (Área Administrativa) sobre a API
// `/api/release-week` (change release-week-backend-e-importacao). Lista, itens e
// escritas vêm do banco; filtros continuam em memória (client-side). Sem
// resposta, a lista fica VAZIA com erro — nunca uma base de demonstração.
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  MESES,
  STATUS_RELEASE,
  calcularKpis,
  filtrarSemanas,
  formatarData,
  formatarPeriodo,
  prefillClone,
  type FiltrosReleaseWeek,
  type ItemRelease,
  type ReleaseWeekModelo,
  type StatusRelease
} from './validadores'

export * from './validadores'

export interface EntradaReleaseWeek {
  nome: string
  versao: string
  release: string
  semana: number
  ano: number
  mes: string
  dataInicio: string
  dataFinaliza: string
  dataPublicacao: string
  status: StatusRelease
  descricao: string
  destaqueSemana: boolean
}

export type DadosReleaseWeek = Partial<EntradaReleaseWeek>

/** Linha derivada da tabela: datas/identificadores já formatados. */
export interface LinhaReleaseWeek {
  id: string
  codigo: string
  nome: string
  semanaAno: string
  periodo: string
  status: StatusRelease
  autor: string
  dataPublicacao: string
  itensCount: number
}

const erro409 = (erro: unknown): string | undefined => {
  const e = erro as { statusMessage?: string; data?: { statusMessage?: string } } | null
  return e?.data?.statusMessage ?? e?.statusMessage
}

export const useReleaseWeekModelo = () => {
  const semanas = useState<ReleaseWeekModelo[]>('release-week-base', () => [])
  const carregando = useState<boolean>('release-week-carregando', () => false)
  const carregado = useState<boolean>('release-week-carregado', () => false)

  // Itens por release (busca lazy + cache por id) — GET /:id/itens.
  const itensPorRelease = useState<Record<string, ItemRelease[]>>(
    'release-week-itens',
    () => ({})
  )
  const itensCarregando = useState<Record<string, boolean>>(
    'release-week-itens-carregando',
    () => ({})
  )
  const itensErro = useState<Record<string, string | null>>('release-week-itens-erro', () => ({}))

  const filtros = useState<FiltrosReleaseWeek>('release-week-filtros', () => ({
    status: '',
    ano: '',
    mes: '',
    autor: ''
  }))

  const carregarSemanas = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    if (forcar) itensPorRelease.value = {}
    try {
      const lista = await useApiFetch<ReleaseWeekModelo[]>('/api/release-week')
      semanas.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      semanas.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  const itensDaRelease = (releaseId: string): ItemRelease[] => itensPorRelease.value[releaseId] ?? []

  const carregarItens = async (releaseId: string, forcar = false): Promise<ItemRelease[]> => {
    const atual = itensPorRelease.value[releaseId]
    if (!forcar && atual) return atual
    if (itensCarregando.value[releaseId]) return atual ?? []
    itensCarregando.value = { ...itensCarregando.value, [releaseId]: true }
    itensErro.value = { ...itensErro.value, [releaseId]: null }
    try {
      const lista = await useApiFetch<ItemRelease[]>(`/api/release-week/${releaseId}/itens`)
      itensPorRelease.value = {
        ...itensPorRelease.value,
        [releaseId]: Array.isArray(lista) ? lista : []
      }
      return itensPorRelease.value[releaseId] ?? []
    } catch {
      itensErro.value = {
        ...itensErro.value,
        [releaseId]: 'Não foi possível carregar os itens desta release.'
      }
      itensPorRelease.value = { ...itensPorRelease.value, [releaseId]: [] }
      return []
    } finally {
      itensCarregando.value = { ...itensCarregando.value, [releaseId]: false }
    }
  }

  const semanasFiltradas = computed(() => filtrarSemanas(semanas.value, filtros.value))

  const linhas = computed<LinhaReleaseWeek[]>(() =>
    semanasFiltradas.value.map((semana) => ({
      id: semana.id,
      codigo: semana.codigo,
      nome: semana.nome,
      semanaAno: `${semana.semana}ª semana / ${semana.ano}`,
      periodo: formatarPeriodo(semana.dataInicio, semana.dataFinaliza),
      status: semana.status,
      autor: semana.autorNome || '—',
      dataPublicacao: formatarData(semana.dataPublicacao),
      itensCount: Number(semana.itensCount ?? 0)
    }))
  )

  const kpis = computed(() => calcularKpis(semanasFiltradas.value))

  const filtrosAtivosCount = computed(
    () =>
      [filtros.value.status, filtros.value.ano, filtros.value.mes, filtros.value.autor].filter(
        Boolean
      ).length
  )

  const opcoes = computed(() => {
    const ativas = semanas.value.filter((semana) => !semana.arquivada)
    return {
      status: [...STATUS_RELEASE],
      anos: [...new Set(ativas.map((semana) => String(semana.ano)))].sort((a, b) => b.localeCompare(a)),
      meses: [...MESES],
      autores: [...new Set(ativas.map((semana) => semana.autorNome).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      )
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', mes: '', autor: '' }
  }

  // -------------------------------------------------------------------------
  // Escritas — pela API. Lançam FetchError (statusCode 400/403/409) para o
  // chamador tratar; a lista local é atualizada com a resposta.
  // -------------------------------------------------------------------------

  const adicionar = async (dados: EntradaReleaseWeek): Promise<ReleaseWeekModelo> => {
    const criada = await useApiFetch<ReleaseWeekModelo>('/api/release-week', {
      method: 'POST',
      body: dados
    })
    semanas.value = [criada, ...semanas.value]
    carregado.value = true
    return criada
  }

  const atualizar = async (
    id: string,
    dados: DadosReleaseWeek
  ): Promise<ReleaseWeekModelo | null> => {
    const atualizada = await useApiFetch<ReleaseWeekModelo>(`/api/release-week/${id}`, {
      method: 'PUT',
      body: dados
    })
    semanas.value = semanas.value.map((semana) => (semana.id === id ? atualizada : semana))
    return atualizada
  }

  const publicar = async (id: string): Promise<boolean> => {
    const publicada = await useApiFetch<ReleaseWeekModelo>(`/api/release-week/${id}/publicar`, {
      method: 'PUT'
    })
    semanas.value = semanas.value.map((semana) => (semana.id === id ? publicada : semana))
    return true
  }

  const arquivar = async (id: string): Promise<boolean> => {
    await useApiFetch(`/api/release-week/${id}/arquivar`, { method: 'PUT' })
    semanas.value = semanas.value.filter((semana) => semana.id !== id)
    return true
  }

  const excluir = async (id: string): Promise<{ ok: boolean; motivo?: string }> => {
    try {
      await useApiFetch(`/api/release-week/${id}`, { method: 'DELETE' })
      semanas.value = semanas.value.filter((semana) => semana.id !== id)
      return { ok: true }
    } catch (erro) {
      return { ok: false, motivo: erro409(erro) ?? 'Não foi possível excluir a Release Week.' }
    }
  }

  const importar = async (
    linhas: Array<{
      nome: string
      versao: string
      release: string
      semana: number
      ano: number
      mes: string
      dataInicio: string
      dataFinaliza: string
      dataPublicacao: string
      status: string
      descricao: string
      destaqueSemana: boolean
    }>
  ): Promise<{ importados: number }> => {
    const resultado = await useApiFetch<{ importados: number }>('/api/release-week/importar', {
      method: 'POST',
      body: { linhas }
    })
    await carregarSemanas(true)
    return resultado
  }

  const clonarPreenchimento = (origem: ReleaseWeekModelo) => prefillClone(origem)

  return {
    semanas,
    carregando,
    carregado,
    carregarSemanas,
    itensPorRelease,
    itensCarregando,
    itensErro,
    itensDaRelease,
    carregarItens,
    filtros,
    semanasFiltradas,
    linhas,
    kpis,
    filtrosAtivosCount,
    opcoes,
    limparFiltros,
    clonarPreenchimento,
    adicionar,
    atualizar,
    publicar,
    arquivar,
    excluir,
    importar
  }
}
