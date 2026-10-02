// Estado da página de Gestão de Auditoria — fase 1 em memória (sem persistência,
// sem chamadas de rede). Modelo de registro conforme docs/02 §3.6 (registrarAuditoria).
import { computed } from 'vue'
import { useState } from '#app'

export type AcaoAuditoria = 'Inclusão' | 'Alteração' | 'Exclusão' | 'Homologação'

export interface RegistroAuditoria {
  id: string
  /** ISO — mais recente primeiro na base */
  registradoEm: string
  usuario: { id: string; nome: string }
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


export const ACOES: AcaoAuditoria[] = ['Inclusão', 'Alteração', 'Exclusão', 'Homologação']

export const VARIANTE_POR_ACAO: Record<AcaoAuditoria, 'done' | 'inReview' | 'blocked' | 'reconciled'> = {
  'Inclusão': 'done',
  'Alteração': 'inReview',
  'Exclusão': 'blocked',
  'Homologação': 'reconciled'
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

const USUARIOS = {
  ana: { id: 'u-ana', nome: 'Ana Carolina Ribeiro' },
  rafael: { id: 'u-rafael', nome: 'Rafael Souza' },
  mariana: { id: 'u-mariana', nome: 'Mariana Lopes' },
  carlos: { id: 'u-carlos', nome: 'Carlos Mendes' }
}

const agora = Date.now()
// Data relativa a "hoje" — mantém o filtro "Últimos N dias" sempre coerente
const dataAtras = (dias: number, horas: number, minutos = 0) => {
  const d = new Date(agora - dias * 86_400_000)
  d.setHours(horas, minutos, 0, 0)
  return d.toISOString()
}

// Base de demonstração — 25 registros já em ordem decrescente (decision 9)
export const REGISTROS: RegistroAuditoria[] = [
  { id: 'log-001', registradoEm: dataAtras(0, 9, 12), usuario: USUARIOS.ana, acao: 'Inclusão', recurso: 'Publicações', detalhes: "Criou a publicação 'Release Week #40 — Correções de Exibição'", ip: '200.189.45.12' },
  { id: 'log-002', registradoEm: dataAtras(0, 8, 47), usuario: USUARIOS.rafael, acao: 'Alteração', recurso: 'Publicações', detalhes: "Alterou o status de 'Manuais Internos' de rascunho para publicado", ip: '189.34.12.8' },
  { id: 'log-003', registradoEm: dataAtras(1, 17, 5), usuario: USUARIOS.carlos, acao: 'Homologação', recurso: 'Perfis de Acesso', detalhes: "Homologou o perfil 'Analista Fiscal' com permissões de leitura", ip: '10.0.0.5' },
  { id: 'log-004', registradoEm: dataAtras(1, 14, 30), usuario: USUARIOS.mariana, acao: 'Alteração', recurso: 'Configurações Globais', detalhes: 'Atualizou a política de retenção de logs de 180 para 365 dias', ip: '177.92.10.44' },
  { id: 'log-005', registradoEm: dataAtras(1, 11, 15), usuario: USUARIOS.ana, acao: 'Exclusão', recurso: 'Logomarcas', detalhes: "Removeu a logomarca de login 'antiga-v2.png'", ip: '200.189.45.12' },
  { id: 'log-006', registradoEm: dataAtras(2, 16, 22), usuario: USUARIOS.rafael, acao: 'Inclusão', recurso: 'Publicações', detalhes: "Criou a publicação 'Manual de Integração API v3'", ip: '191.5.200.7' },
  { id: 'log-007', registradoEm: dataAtras(2, 10, 5), usuario: USUARIOS.carlos, acao: 'Alteração', recurso: 'Usuários', detalhes: "Alterou o perfil de acesso de 'João Lima' para Editor", ip: '10.0.0.5' },
  { id: 'log-008', registradoEm: dataAtras(3, 15, 40), usuario: USUARIOS.mariana, acao: 'Inclusão', recurso: 'Logomarcas', detalhes: "Enviou nova logomarca do header 'logo-header.png'", ip: '177.92.10.44' },
  { id: 'log-009', registradoEm: dataAtras(3, 9, 20), usuario: USUARIOS.ana, acao: 'Alteração', recurso: 'Rate Limits', detalhes: 'Revalidou as regras de rate limit do módulo de autenticação', ip: '200.189.45.12' },
  { id: 'log-010', registradoEm: dataAtras(4, 18, 3), usuario: USUARIOS.rafael, acao: 'Homologação', recurso: 'Publicações', detalhes: "Homologou a publicação 'Release Week #39'", ip: '189.34.12.8' },
  { id: 'log-011', registradoEm: dataAtras(4, 11, 48), usuario: USUARIOS.carlos, acao: 'Inclusão', recurso: 'Usuários', detalhes: "Criou o usuário 'paula.torres@empresa.com.br' com perfil Revisora", ip: '10.0.0.5' },
  { id: 'log-012', registradoEm: dataAtras(5, 16, 10), usuario: USUARIOS.mariana, acao: 'Alteração', recurso: 'Perfis de Acesso', detalhes: "Revogou a permissão 'exportar' do perfil Convidado", ip: '177.92.10.44' },
  { id: 'log-013', registradoEm: dataAtras(6, 14, 25), usuario: USUARIOS.ana, acao: 'Inclusão', recurso: 'Configurações Globais', detalhes: 'Definiu a logomarca padrão da tela de login', ip: '200.189.45.12' },
  { id: 'log-014', registradoEm: dataAtras(7, 10, 33), usuario: USUARIOS.rafael, acao: 'Exclusão', recurso: 'Publicações', detalhes: "Removeu a publicação duplicada 'Release Week #38 (cópia)'", ip: '191.5.200.7' },
  { id: 'log-015', registradoEm: dataAtras(8, 15, 55), usuario: USUARIOS.carlos, acao: 'Alteração', recurso: 'Rate Limits', detalhes: 'Bloqueou o IP 45.190.22.1 por tentativas suspeitas', ip: '10.0.0.5' },
  { id: 'log-016', registradoEm: dataAtras(9, 9, 44), usuario: USUARIOS.mariana, acao: 'Inclusão', recurso: 'Perfis de Acesso', detalhes: "Criou o perfil 'Auditor Somente-Leitura'", ip: '177.92.10.44' },
  { id: 'log-017', registradoEm: dataAtras(11, 17, 12), usuario: USUARIOS.ana, acao: 'Homologação', recurso: 'Usuários', detalhes: "Homologou a troca de perfil de 'Camila Rocha' para Super Admin", ip: '200.189.45.12' },
  { id: 'log-018', registradoEm: dataAtras(12, 13, 7), usuario: USUARIOS.rafael, acao: 'Alteração', recurso: 'Logomarcas', detalhes: 'Substituiu a logomarca do header para a versão 2.1', ip: '189.34.12.8' },
  { id: 'log-019', registradoEm: dataAtras(14, 16, 40), usuario: USUARIOS.carlos, acao: 'Inclusão', recurso: 'Publicações', detalhes: "Criou a publicação 'Escopo de Projetos — Outubro'", ip: '10.0.0.5' },
  { id: 'log-020', registradoEm: dataAtras(16, 11, 22), usuario: USUARIOS.mariana, acao: 'Exclusão', recurso: 'Usuários', detalhes: "Desativou o usuário 'teste.hml@empresa.com.br'", ip: '177.92.10.44' },
  { id: 'log-021', registradoEm: dataAtras(18, 14, 58), usuario: USUARIOS.ana, acao: 'Alteração', recurso: 'Configurações Globais', detalhes: 'Habilitou a exibição de tooltips na sidebar', ip: '200.189.45.12' },
  { id: 'log-022', registradoEm: dataAtras(20, 10, 15), usuario: USUARIOS.rafael, acao: 'Homologação', recurso: 'Logomarcas', detalhes: "Homologou a logomarca de login 'novo-login.svg'", ip: '191.5.200.7' },
  { id: 'log-023', registradoEm: dataAtras(22, 15, 31), usuario: USUARIOS.carlos, acao: 'Inclusão', recurso: 'Rate Limits', detalhes: 'Registrou nova regra de bloqueio para a rota /api/login', ip: '10.0.0.5' },
  { id: 'log-024', registradoEm: dataAtras(25, 9, 5), usuario: USUARIOS.mariana, acao: 'Alteração', recurso: 'Perfis de Acesso', detalhes: "Renomeou o perfil 'Operador' para 'Operador de Publicação'", ip: '177.92.10.44' },
  { id: 'log-025', registradoEm: dataAtras(28, 17, 49), usuario: USUARIOS.ana, acao: 'Inclusão', recurso: 'Usuários', detalhes: "Criou o usuário 'carlos.mendes@empresa.com.br' com perfil Administrador", ip: '200.189.45.12' }
]

export const useAuditoriaDemo = () => {
  const filtros = useState<FiltrosAuditoria>('auditoria-filtros', () => ({
    dataInicial: '',
    dataFinal: '',
    usuario: '',
    acao: '',
    recurso: ''
  }))

  const registrosFiltrados = computed<RegistroAuditoria[]>(() => {
    const f = filtros.value
    return REGISTROS.filter((r) => {
      const dia = diaLocal(r.registradoEm)
      if (f.dataInicial && dia < f.dataInicial) return false
      if (f.dataFinal && dia > f.dataFinal) return false
      if (f.usuario && r.usuario.nome !== f.usuario) return false
      if (f.acao && r.acao !== f.acao) return false
      if (f.recurso && r.recurso !== f.recurso) return false
      return true
    })
  })

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

  const opcoesUsuarios = computed(() =>
    [...new Set(REGISTROS.map((r) => r.usuario.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )
  const opcoesRecursos = computed(() =>
    [...new Set(REGISTROS.map((r) => r.recurso))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )

  const limparFiltros = () => {
    filtros.value = { dataInicial: '', dataFinal: '', usuario: '', acao: '', recurso: '' }
  }

  return { filtros, registrosFiltrados, filtrosAtivosCount, periodoRotulo, opcoesUsuarios, opcoesRecursos, limparFiltros }
}

export const formatarDataHora = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}