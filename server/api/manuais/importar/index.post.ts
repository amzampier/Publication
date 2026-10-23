// POST /api/manuais/importar — importa as linhas revalidadas (transação;
// 400 com motivos/conflitos; 403 sem manuais/importar).
import { importarManuais } from '../../../utils/manuais'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'manuais', 'importar')
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })

  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarManuais(body?.linhas, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Manuais Mensais',
    detalhes: `Importou ${resultado.importados} manual(is) via planilha`
  })
  return resultado
})
