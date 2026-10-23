// POST /api/escopo-projetos/importar — importa as linhas revalidadas
// (transação; 400 com motivos/conflitos; 403 sem escopo-projetos/importar).
import { importarEscopos } from '../../../utils/escopo-projetos'
import { registrarAuditoria } from '../../../utils/audit'
import { getSessionUser } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'escopo-projetos', 'importar')
  const sessao = await getSessionUser(event)
  if (!sessao) throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  const body = await readBody<{ linhas?: unknown }>(event)
  const resultado = await importarEscopos(body?.linhas, {
    id: sessao.id,
    nome: sessao.nome,
    perfil: sessao.perfil
  })
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Escopo de Projetos',
    detalhes: `Importou ${resultado.importados} escopo(s) via planilha`
  })
  return resultado
})
