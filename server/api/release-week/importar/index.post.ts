// POST /api/release-week/importar — importa as linhas revalidadas
// (transação; 400 com motivos/conflitos; 403 sem release-week/importar).
import { importarReleaseWeeks } from '../../../utils/release-week'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'release-week', 'importar')
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarReleaseWeeks(body?.linhas, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Release Week',
    detalhes: `Importou ${resultado.importados} Release Week(s) via planilha`
  })
  return resultado
})
