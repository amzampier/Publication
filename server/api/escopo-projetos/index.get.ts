// GET /api/escopo-projetos — escopos não arquivados (com itensCount e
// softwares derivados); ?exportar=1 exige escopo-projetos/exportar.
import { listarEscopos } from '../../utils/escopo-projetos'
import { requirePermission } from '../../utils/permission'

export default defineEventHandler(async (event) => {
  const exportando = String(getQuery(event).exportar ?? '').trim() === '1'
  await requirePermission(event, 'escopo-projetos', exportando ? 'exportar' : 'visualizar')
  return await listarEscopos()
})
