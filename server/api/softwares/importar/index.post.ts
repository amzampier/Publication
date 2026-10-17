// POST /api/softwares/importar — grava as linhas selecionadas (revalidação +
// transação + códigos sequenciais; 400 com motivos/conflitos)
import { importarSoftwares } from '../../../utils/softwares'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'softwares', 'importar')
  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarSoftwares(body?.linhas)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Softwares',
    detalhes: `Importou ${resultado.importados} software(s) via planilha`
  })
  return resultado
})
