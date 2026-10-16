// POST /api/usuarios/importar — grava linhas selecionadas (revalidação +
// transação + hash sentinela; 400 com motivos; design D4)
import { importarUsuarios } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'importar')
  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarUsuarios(body?.linhas)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Usuários',
    detalhes: `Importou ${resultado.importados} usuário(s) via planilha`
  })
  return resultado
})
