// Estado da página de Manuais Mensais (Área Administrativa) sobre a API
// `/api/manuais` (change manuais-backend-e-importacao). Lista, itens e
// escritas vêm do banco; filtros continuam em memória (client-side). Sem
// resposta, a lista fica VAZIA com erro — nunca uma base de demonstração.
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  calcularKpis,
  filtrarManuais,
  formatarData,
  formatarMesAno,
  prefillClone,
  MESES,
  STATUS_MANUAL,
  type FiltrosManuais,
  type ItemManual,
  type LinhaManual,
  type ManuaisModelo,
  type StatusManual
} from './validadores'

export * from './validadores'

export interface EntradaManual {
  titulo: string
  descricao: string
  mes: string
  ano: number
  status: StatusManual
  destaqueMes: boolean
  destaqueSemana: boolean
}

export type DadosManual = Partial<EntradaManual>

const erro409 = (erro: unknown): string | undefined => {
  const e = erro as { statusMessage?: string; data?: { statusMessage?: string } } | null
  return e?.data?.statusMessage ?? e?.statusMessage
}

export const useManuaisModelo = () => {
  const manuais = useState<ManuaisModelo[]>('manuais-base', () => [])
  const carregando = useState<boolean>('manuais-carregando', () => false)
  const carregado = useState<boolean>('manuais-carregado', () => false)

  // Itens por manual (busca lazy + cache por id) — GET /:id/itens.
  const itensPorManual = useState<Record<string, ItemManual[]>>(
    'manuais-itens',
    () => ({})
  )
  const itensCarregando = useState<Record<string, boolean>>(
    'manuais-itens-carregando',
    () => ({})
  )
  const itensErro = useState<Record<string, string | null>>('manuais-itens-erro', () => ({}))

  const filtros = useState<FiltrosManuais>('manuais-filtros', () => ({
    status: '',
    ano: '',
    mes: '',
    autor: '',
    destaque: ''
  }))

  const carregarManuais = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<ManuaisModelo[]>('/api/manuais')
      manuais.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      manuais.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  const itensDoManual = (manualId: string): ItemManual[] =>
    itensPorManual.value[manualId] ?? []

  const carregarItens = async (manualId: string, forcar = false): Promise<ItemManual[]> => {
    const atual = itensPorManual.value[manualId]
    if (!forcar && atual) return atual
    if (itensCarregando.value[manualId]) return atual ?? []
    itensCarregando.value = { ...itensCarregando.value, [manualId]: true }
    itensErro.value = { ...itensErro.value, [manualId]: null }
    try {
      const lista = await useApiFetch<ItemManual[]>(`/api/manuais/${manualId}/itens`)
      itensPorManual.value = {
        ...itensPorManual.value,
        [manualId]: Array.isArray(lista) ? lista : []
      }
      return itensPorManual.value[manualId] ?? []
    } catch {
      itensErro.value = {
        ...itensErro.value,
        [manualId]: 'Não foi possível carregar os itens deste manual.'
      }
      itensPorManual.value = { ...itensPorManual.value, [manualId]: [] }
      return []
    } finally {
      itensCarregando.value = { ...itensCarregando.value, [manualId]: false }
    }
  }

  const manuaisFiltrados = computed(() => filtrarManuais(manuais.value, filtros.value))

  const linhas = computed<LinhaManual[]>(() =>
    manuaisFiltrados.value.map((manual) => ({
      id: manual.id,
      codigo: manual.codigo,
      titulo: manual.titulo,
      mesAno: formatarMesAno(manual),
      status: manual.status,
      autor: manual.autorNome || '—',
      dataPublicacao: formatarData(manual.dataPublicacao),
      destaqueMes: manual.destaqueMes,
      destaqueSemana: manual.destaqueSemana,
      itensCount: Number(manual.itensCount ?? 0)
    }))
  )

  const kpis = computed(() => calcularKpis(manuaisFiltrados.value))

  const filtrosAtivosCount = computed(
    () =>
      [
        filtros.value.status,
        filtros.value.ano,
        filtros.value.mes,
        filtros.value.autor,
        filtros.value.destaque
      ].filter(Boolean).length
  )

  const opcoes = computed(() => {
    const ativos = manuais.value.filter((manual) => !manual.arquivada)
    return {
      status: [...STATUS_MANUAL],
      anos: [...new Set(ativos.map((manual) => String(manual.ano)))].sort((a, b) =>
        b.localeCompare(a)
      ),
      meses: [...MESES],
      autores: [...new Set(ativos.map((manual) => manual.autorNome).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
      destaques: [
        { value: '', label: 'Todos' },
        { value: 'mes', label: 'Destaque do mês' },
        { value: 'semana', label: 'Destaque da semana' }
      ]
    }
  })

  const limparFiltros = () => {
    filtros.value = { status: '', ano: '', mes: '', autor: '', destaque: '' }
  }

  // -------------------------------------------------------------------------
  // Escritas — pela API. Lançam FetchError (400/403/409) para o chamador
  // tratar; a lista local é atualizada com a resposta.
  // -------------------------------------------------------------------------

  const adicionar = async (dados: EntradaManual): Promise<ManuaisModelo> => {
    const criado = await useApiFetch<ManuaisModelo>('/api/manuais', {
      method: 'POST',
      body: dados
    })
    manuais.value = [criado, ...manuais.value]
    carregado.value = true
    return criado
  }

  const atualizar = async (
    id: string,
    dados: DadosManual
  ): Promise<ManuaisModelo | null> => {
    const atualizado = await useApiFetch<ManuaisModelo>(`/api/manuais/${id}`, {
      method: 'PUT',
      body: dados
    })
    manuais.value = manuais.value.map((manual) => (manual.id === id ? atualizado : manual))
    return atualizado
  }

  const publicar = async (id: string): Promise<boolean> => {
    const publicado = await useApiFetch<ManuaisModelo>(`/api/manuais/${id}/publicar`, {
      method: 'PUT'
    })
    manuais.value = manuais.value.map((manual) => (manual.id === id ? publicado : manual))
    return true
  }

  const arquivar = async (id: string): Promise<boolean> => {
    await useApiFetch(`/api/manuais/${id}/arquivar`, { method: 'PUT' })
    manuais.value = manuais.value.filter((manual) => manual.id !== id)
    return true
  }

  const excluir = async (id: string): Promise<{ ok: boolean; motivo?: string }> => {
    try {
      await useApiFetch(`/api/manuais/${id}`, { method: 'DELETE' })
      manuais.value = manuais.value.filter((manual) => manual.id !== id)
      const { [id]: _removido, ...resto } = itensPorManual.value
      itensPorManual.value = resto
      return { ok: true }
    } catch (erro) {
      return { ok: false, motivo: erro409(erro) ?? 'Não foi possível excluir o manual.' }
    }
  }

  const importar = async (
    linhasImportadas: Array<{
      titulo: string
      descricao: string
      mes: string
      ano: number
      status: string
      dataCriacao: string
      dataPublicacao: string
      destaqueMes: boolean
      destaqueSemana: boolean
    }>
  ): Promise<{ importados: number }> => {
    const resultado = await useApiFetch<{ importados: number }>('/api/manuais/importar', {
      method: 'POST',
      body: { linhas: linhasImportadas }
    })
    await carregarManuais(true)
    return resultado
  }

  const clonarPreenchimento = (origem: ManuaisModelo) => prefillClone(origem)

  return {
    manuais,
    carregando,
    carregado,
    carregarManuais,
    itensPorManual,
    itensDoManual,
    carregarItens,
    itensCarregando,
    itensErro,
    filtros,
    manuaisFiltrados,
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
