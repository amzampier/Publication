// GET /api/esteira-revisao/progresso — progresso global para sincronizar o painel após uma transição.
import { requirePermission } from '../../utils/permission'
import { obterProgressoEsteira } from '../../utils/esteira-revisao'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'esteira-revisao', 'visualizar')
  return { progresso: await obterProgressoEsteira() }
})
