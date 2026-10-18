// POST /api/parceiros/importar — importação por planilha (200 | 400 com motivos/conflitos)
import { importarParceiros } from '../../../utils/parceiros'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'parceiros', 'importar')
  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarParceiros(body?.linhas)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Parceiros',
    detalhes: `Importou ${resultado.importados} parceiro(s) por planilha`
  })
  return resultado
})
