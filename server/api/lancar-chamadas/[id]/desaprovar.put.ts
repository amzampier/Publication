import { createError } from 'h3'
import { desaprovarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'
import { getSessionUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'alterar')
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const corpo = (await readBody(event).catch(() => ({}))) as { parecer?: unknown }
  const desaprovada = await desaprovarChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    { parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined }
  )
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Lançar as Chamadas',
    entidadeId: desaprovada.id,
    detalhes: `Desaprovou a chamada '${desaprovada.chamada}' (${desaprovada.titulo})`
  })
  return desaprovada
})
