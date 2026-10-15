// GET /api/auditoria — registros da trilha para a tela de Gestão de Auditoria
// (middleware auth-api.ts exige sessão: 401 sem login). Filtros estruturais por
// query param; resposta { registros, opcoes } — opcoes do conjunto não filtrado
// (change auditoria-backend-integracao).
import { listarAuditoria } from '../../utils/audit'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  return await listarAuditoria({
    dataInicial: texto(q.dataInicial),
    dataFinal: texto(q.dataFinal),
    usuario: texto(q.usuario),
    acao: texto(q.acao),
    recurso: texto(q.recurso)
  })
})
