// GET /api/auditoria — registros da trilha para a tela de Gestão de Auditoria
// (middleware auth-api.ts exige sessão: 401 sem login). Filtros estruturais por
// query param; resposta { registros, opcoes } — opcoes do conjunto não filtrado
// (change auditoria-backend-integracao).
import { listarAuditoria } from '../../utils/audit'
import { requirePermission } from '../../utils/permission'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const inteiro = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'auditoria', 'visualizar')
  const q = getQuery(event)
  return await listarAuditoria({
    dataInicial: texto(q.dataInicial),
    dataFinal: texto(q.dataFinal),
    usuario: texto(q.usuario),
    acao: texto(q.acao),
    recurso: texto(q.recurso),
    busca: texto(q.busca),
    pagina: inteiro(q.pagina),
    porPagina: inteiro(q.porPagina),
    exportar: texto(q.exportar) === '1' || texto(q.exportar) === 'true'
  })
})
