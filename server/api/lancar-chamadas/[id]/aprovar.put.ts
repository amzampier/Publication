import { createError } from 'h3'
import { aprovarChamada, validarIdChamada } from '../../../utils/lancar-chamadas'
import { registrarAuditoria } from '../../../utils/audit'
import { requirePermission } from '../../../utils/permission'
import { getSessionUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'publicar')
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }
  const id = validarIdChamada(getRouterParam(event, 'id'))
  const corpo = (await readBody(event).catch(() => ({}))) as {
    parecer?: unknown
    criterios?: unknown
  }
  const aprovada = await aprovarChamada(
    id,
    { id: sessao.id, nome: sessao.nome, perfil: sessao.perfil },
    {
      parecer: typeof corpo?.parecer === 'string' ? corpo.parecer : undefined,
      criterios: typeof corpo?.criterios === 'boolean' ? corpo.criterios : undefined
    }
  )
  await registrarAuditoria(event, {
    acao: 'Homologação',
    recurso: 'Lançar as Chamadas',
    entidadeId: aprovada.id,
    detalhes: `Aprovou a chamada '${aprovada.chamada}' (${aprovada.titulo})`
  })
  return aprovada
})
