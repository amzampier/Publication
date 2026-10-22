import { createError } from 'h3'
import { recusarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
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
  const corpo = (await readBody(event).catch(() => ({}))) as {
    parecer?: unknown
    criterios?: unknown
  }
  const recusada = await recusarChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    {
      parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined,
      criterios: typeof corpo?.criterios === 'boolean' ? corpo.criterios : undefined
    }
  )
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Lançar as Chamadas',
    entidadeId: recusada.id,
    detalhes: `Recusou a chamada '${recusada.chamada}' (${recusada.titulo})`
  })
  return recusada
})
