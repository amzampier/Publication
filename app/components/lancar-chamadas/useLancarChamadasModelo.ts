import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import { useAuth } from '../../composables/useAuth'
import {
  buscarChamadas,
  calcularKpis,
  filtrarChamadas,
  formatarData,
  type CatalogosChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type FiltrosChamada,
  type ImpactoChamada,
  type LinhaImportacaoChamada,
  type OrigemChamada,
  type StatusChamada,
  type TipoChamada,
  IMPACTOS_CHAMADA as CATALOGOS_CHAMADAS_IMPACTOS,
  ORIGENS_CHAMADA as CATALOGOS_CHAMADAS_ORIGENS,
  SITUACOES_CHAMADA as CATALOGOS_CHAMADAS_SITUACOES,
  STATUS_CHAMADA as CATALOGOS_CHAMADAS_STATUS,
  TIPOS_CHAMADA as CATALOGOS_CHAMADAS_TIPOS
} from './validadores'

export * from './validadores'

export interface LinhaChamada {
  id: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  status: StatusChamada
  dataLancamento: string
  dataLiberacao: string
  dataLancamentoIso: string
  dataLiberacaoIso: string
  origem: OrigemChamada
}

const FILTROS_VAZIOS: FiltrosChamada = {
  status: '',
  situacao: '',
  tipo: '',
  impacto: '',
  softwareId: '',
  parceiroId: '',
  origem: '',
  dataLancamentoDe: '',
  dataLancamentoAte: '',
  dataLiberacaoDe: '',
  dataLiberacaoAte: ''
}

const CATALOGO_VAZIO: CatalogosChamada = {
  releases: [],
  projetos: [],
  manuais: [],
  softwares: [],
  parceiros: []
}

export const useLancarChamadasModelo = () => {
  const chamadas = useState<ChamadaModelo[]>('lancar-chamadas-base', () => [])
  const catalogo = useState<CatalogosChamada>('lancar-chamadas-catalogo', () => ({
    ...CATALOGO_VAZIO
  }))
  const carregando = useState<boolean>('lancar-chamadas-carregando', () => false)
  const carregado = useState<boolean>('lancar-chamadas-carregado', () => false)
  const busca = useState<string>('lancar-chamadas-busca', () => '')
  const filtros = useState<FiltrosChamada>('lancar-chamadas-filtros', () => ({
    ...FILTROS_VAZIOS
  }))
  const { usuario } = useAuth()

  const autorAtual = computed(() => ({
    id: usuario.value?.id ?? 'sistema',
    nome: usuario.value?.nome ?? 'Sistema'
  }))

  const carregarChamadas = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const [lista, opcoes] = await Promise.all([
        useApiFetch<{ chamadas: ChamadaModelo[] }>('/api/lancar-chamadas'),
        useApiFetch<CatalogosChamada>('/api/lancar-chamadas/opcoes')
      ])
      chamadas.value = lista.chamadas
      catalogo.value = opcoes
      carregado.value = true
      return true
    } catch {
      chamadas.value = []
      catalogo.value = { ...CATALOGO_VAZIO }
      carregado.value = false
      return false
    } finally {
      carregando.value = false
    }
  }

  const chamadasFiltradas = computed(() =>
    buscarChamadas(filtrarChamadas(chamadas.value, filtros.value), busca.value)
  )

  const linhas = computed<LinhaChamada[]>(() =>
    chamadasFiltradas.value.map((chamada) => ({
      id: chamada.id,
      chamada: chamada.chamada,
      titulo: chamada.titulo,
      software: chamada.software,
      modulo: chamada.modulo,
      tipo: chamada.tipo,
      impacto: chamada.impacto,
      status: chamada.status,
      dataLancamento: formatarData(chamada.dataLancamento),
      dataLiberacao: formatarData(chamada.dataLiberacao),
      dataLancamentoIso: chamada.dataLancamento,
      dataLiberacaoIso: chamada.dataLiberacao,
      origem: chamada.origem
    }))
  )

  const kpis = computed(() => calcularKpis(chamadasFiltradas.value))

  const filtrosAtivosCount = computed(
    () =>
      [
        filtros.value.status,
        filtros.value.situacao,
        filtros.value.tipo,
        filtros.value.impacto,
        filtros.value.softwareId,
        filtros.value.parceiroId,
        filtros.value.origem,
        filtros.value.dataLancamentoDe,
        filtros.value.dataLancamentoAte,
        filtros.value.dataLiberacaoDe,
        filtros.value.dataLiberacaoAte
      ].filter(Boolean).length
  )

  const criteriosAtivosCount = computed(
    () => filtrosAtivosCount.value + (busca.value.trim() ? 1 : 0)
  )

  const opcoes = computed(() => ({
    status: [...CATALOGOS_CHAMADAS_STATUS],
    situacoes: [...CATALOGOS_CHAMADAS_SITUACOES],
    tipos: [...CATALOGOS_CHAMADAS_TIPOS],
    impactos: [...CATALOGOS_CHAMADAS_IMPACTOS],
    origens: [...CATALOGOS_CHAMADAS_ORIGENS],
    softwares: catalogo.value.softwares,
    parceiros: catalogo.value.parceiros
  }))

  const limparFiltros = () => {
    filtros.value = { ...FILTROS_VAZIOS }
  }

  const resolver = (id: string): ChamadaModelo | null =>
    chamadas.value.find((chamada) => chamada.id === id) ?? null

  const adicionar = async (entrada: EntradaChamada): Promise<ChamadaModelo> => {
    const criada = await useApiFetch<ChamadaModelo>('/api/lancar-chamadas', {
      method: 'POST',
      body: entrada
    })
    chamadas.value = [criada, ...chamadas.value]
    carregado.value = true
    return criada
  }

  const atualizar = async (id: string, entrada: EntradaChamada): Promise<ChamadaModelo> => {
    const atualizada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}`, {
      method: 'PUT',
      body: entrada
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? atualizada : chamada))
    return atualizada
  }

  const aprovar = async (id: string): Promise<ChamadaModelo> => {
    const aprovada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}/aprovar`, {
      method: 'PUT'
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? aprovada : chamada))
    return aprovada
  }

  const desaprovar = async (id: string): Promise<ChamadaModelo> => {
    const desaprovada = await useApiFetch<ChamadaModelo>(
      `/api/lancar-chamadas/${id}/desaprovar`,
      { method: 'PUT' }
    )
    chamadas.value = chamadas.value.map((chamada) =>
      chamada.id === id ? desaprovada : chamada
    )
    return desaprovada
  }

  const recusar = async (id: string): Promise<ChamadaModelo> => {
    const recusada = await useApiFetch<ChamadaModelo>(`/api/lancar-chamadas/${id}/recusar`, {
      method: 'PUT'
    })
    chamadas.value = chamadas.value.map((chamada) => (chamada.id === id ? recusada : chamada))
    return recusada
  }

  const excluir = async (id: string): Promise<void> => {
    await useApiFetch(`/api/lancar-chamadas/${id}`, { method: 'DELETE' })
    chamadas.value = chamadas.value.filter((chamada) => chamada.id !== id)
  }

  const importar = async (
    linhasImportadas: LinhaImportacaoChamada[]
  ): Promise<{ importados: number }> => {
    const resultado = await useApiFetch<{ importados: number }>(
      '/api/lancar-chamadas/importar',
      { method: 'POST', body: { linhas: linhasImportadas } }
    )
    await carregarChamadas(true)
    return resultado
  }

  return {
    chamadas,
    catalogo,
    carregando,
    carregado,
    busca,
    filtros,
    autorAtual,
    carregarChamadas,
    chamadasFiltradas,
    linhas,
    kpis,
    filtrosAtivosCount,
    criteriosAtivosCount,
    opcoes,
    limparFiltros,
    resolver,
    adicionar,
    atualizar,
    aprovar,
    desaprovar,
    recusar,
    excluir,
    importar
  }
}
