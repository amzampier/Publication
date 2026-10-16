// Estado da página de Gestão de Auditoria sobre a API /api/auditoria (change
// auditoria-backend-integracao). O contrato público da fase 1 é preservado
// (mesmo precedente de usePerfisModelo): os registros vêm do banco, as gravações
// são feitas pelas rotas de escrita e nada é semeado em memória — sem resposta,
// a lista fica vazia com erro, nunca a demo antiga fingindo ser real.
// Modelo de registro conforme docs/02 §3.6 (registrarAuditoria): o servidor
// devolve `recurso` mapeado da coluna `entidade`. O shape da API está duplicado
// aqui (barreira app/ × server/ — mantenha server/utils/audit.ts em sincronia).
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'

export type AcaoAuditoria = 'Inclusão' | 'Alteração' | 'Exclusão' | 'Homologação' | 'Acesso'

export interface RegistroAuditoria {
  id: string
  /** ISO — mais recente primeiro (ordenado pelo servidor) */
  registradoEm: string
  /** `id` null = operador sem conta vinculada (ex.: registros do seed) */
  usuario: { id: string | null; nome: string }
  acao: AcaoAuditoria
  recurso: string
  detalhes: string
  ip: string
}

export interface FiltrosAuditoria {
  /** '' = sem limite; 'yyyy-mm-dd' (dia local) */
  dataInicial: string
  dataFinal: string
  usuario: string
  acao: string
  recurso: string
}

export interface KpisAuditoria {
  registros: number
  usuariosDistintos: number
  ultimaAtividade: string | null
}

/** Resposta de GET /api/auditoria (espelho de server/utils/audit.ts). */
interface RespostaAuditoriaApi {
  registros: RegistroAuditoria[]
  total: number
  kpis: KpisAuditoria
  opcoes: { usuarios: string[]; recursos: string[] }
  pagina: number
  porPagina: number
}

export const POR_PAGINA_PADRAO = 20

export const ACOES: AcaoAuditoria[] = ['Inclusão', 'Alteração', 'Exclusão', 'Homologação', 'Acesso']

export const VARIANTE_POR_ACAO: Record<AcaoAuditoria, 'done' | 'inReview' | 'blocked' | 'reconciled' | 'neutral'> = {
  'Inclusão': 'done',
  'Alteração': 'inReview',
  'Exclusão': 'blocked',
  'Homologação': 'reconciled',
  'Acesso': 'neutral'
}
/** Data local no formato 'yyyy-mm-dd' (sem depender do fuso do ISO) */
export const diaLocal = (iso: string) => {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 'yyyy-mm-dd' -> Date local (meio-dia evita o deslocamento de fuso na troca) */
export const dataIsoParaDate = (iso: string): Date | null => {
  if (!iso) return null
  const [a, m, d] = iso.split('-').map(Number)
  if (!a || !m || !d) return null
  return new Date(a, m - 1, d, 12, 0, 0)
}

/** Date do UiDatePicker -> 'yyyy-mm-dd' local */
export const dateParaIso = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 'yyyy-mm-dd' -> 'dd/mm' */
export const formatarDataCurta = (iso: string) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}`
}

export const VAZIO_FILTROS: FiltrosAuditoria = {
  dataInicial: '',
  dataFinal: '',
  usuario: '',
  acao: '',
  recurso: ''
}

export const useAuditoriaModelo = () => {
  const registros = useState<RegistroAuditoria[]>('auditoria-registros', () => [])
  const carregando = useState<boolean>('auditoria-carregando', () => false)
  const carregado = useState<boolean>('auditoria-carregado', () => false)
  const opcoes = useState<{ usuarios: string[]; recursos: string[] }>('auditoria-opcoes', () => ({
    usuarios: [],
    recursos: []
  }))
  const filtros = useState<FiltrosAuditoria>('auditoria-filtros', () => ({ ...VAZIO_FILTROS }))

  // Estado de paginação/KPIs no servidor (change paginacao-server-side-e-performance)
  const pagina = useState<number>('auditoria-pagina', () => 1)
  const porPagina = useState<number>('auditoria-por-pagina', () => POR_PAGINA_PADRAO)
  const total = useState<number>('auditoria-total', () => 0)
  const kpis = useState<KpisAuditoria>('auditoria-kpis', () => ({
    registros: 0,
    usuariosDistintos: 0,
    ultimaAtividade: null
  }))
  const busca = useState<string>('auditoria-busca', () => '')

  /**
   * Busca a página com os filtros/busca/paginação VIGENTES no servidor.
   * Devolve `false` quando a carga falha — o chamador mostra o toast de erro e
   * a lista permanece vazia.
   */
  const carregarAuditoria = async (): Promise<boolean> => {
    if (carregando.value) return false
    carregando.value = true
    try {
      const f = filtros.value
      const resposta = await useApiFetch<RespostaAuditoriaApi>('/api/auditoria', {
        query: {
          dataInicial: f.dataInicial || undefined,
          dataFinal: f.dataFinal || undefined,
          usuario: f.usuario || undefined,
          acao: f.acao || undefined,
          recurso: f.recurso || undefined,
          busca: busca.value || undefined,
          pagina: pagina.value,
          porPagina: porPagina.value
        }
      })
      registros.value = Array.isArray(resposta?.registros) ? resposta.registros : []
      total.value = Number(resposta?.total ?? 0)
      kpis.value = resposta?.kpis ?? { registros: 0, usuariosDistintos: 0, ultimaAtividade: null }
      opcoes.value = {
        usuarios: resposta?.opcoes?.usuarios ?? [],
        recursos: resposta?.opcoes?.recursos ?? []
      }
      carregado.value = true
      return true
    } catch {
      registros.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  /** Aplica os filtros vigentes: volta à 1ª página e recarrega. */
  const aplicarFiltros = async (): Promise<void> => {
    pagina.value = 1
    await carregarAuditoria()
  }

  const irParaPagina = async (p: number): Promise<void> => {
    pagina.value = p
    await carregarAuditoria()
  }

  const mudarPorPagina = async (n: number): Promise<void> => {
    porPagina.value = n
    pagina.value = 1
    await carregarAuditoria()
  }

  const buscar = async (termo: string): Promise<void> => {
    busca.value = termo
    pagina.value = 1
    await carregarAuditoria()
  }

  /** Conjunto filtrado COMPLETO (todas as páginas) para CSV/PDF. */
  const buscarParaExportacao = async (): Promise<RegistroAuditoria[]> => {
    const f = filtros.value
    const resposta = await useApiFetch<RespostaAuditoriaApi>('/api/auditoria', {
      query: {
        dataInicial: f.dataInicial || undefined,
        dataFinal: f.dataFinal || undefined,
        usuario: f.usuario || undefined,
        acao: f.acao || undefined,
        recurso: f.recurso || undefined,
        busca: busca.value || undefined,
        exportar: '1'
      }
    })
    return Array.isArray(resposta?.registros) ? resposta.registros : []
  }

  const registrosFiltrados = computed<RegistroAuditoria[]>(() => registros.value)

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.dataInicial, !!f.dataFinal, !!f.usuario, !!f.acao, !!f.recurso].filter(Boolean).length
  })

  const periodoRotulo = computed(() => {
    const { dataInicial, dataFinal } = filtros.value
    if (dataInicial && dataFinal) return `${formatarDataCurta(dataInicial)} – ${formatarDataCurta(dataFinal)}`
    if (dataInicial) return `A partir de ${formatarDataCurta(dataInicial)}`
    if (dataFinal) return `Até ${formatarDataCurta(dataFinal)}`
    return 'Tudo'
  })

  const opcoesUsuarios = computed(() => opcoes.value.usuarios)
  const opcoesRecursos = computed(() => opcoes.value.recursos)

  const limparFiltros = () => {
    filtros.value = { ...VAZIO_FILTROS }
  }

  return {
    filtros,
    carregando,
    carregado,
    carregarAuditoria,
    aplicarFiltros,
    irParaPagina,
    mudarPorPagina,
    buscar,
    buscarParaExportacao,
    pagina,
    porPagina,
    total,
    kpis,
    busca,
    registros,
    registrosFiltrados,
    filtrosAtivosCount,
    periodoRotulo,
    opcoesUsuarios,
    opcoesRecursos,
    limparFiltros
  }
}

export const formatarDataHora = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}
