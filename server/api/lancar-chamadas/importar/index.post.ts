import { importarChamadas } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'importar')
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarChamadas(body?.linhas, {
    id: sessao.id,
    nome: sessao.nome
  })
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Lançar as Chamadas',
    detalhes: `Importou ${resultado.importados} chamada(s) via planilha`
  })
  return resultado
})
