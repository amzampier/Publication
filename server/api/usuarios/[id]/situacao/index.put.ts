// PUT /api/usuarios/:id/situacao — Bloquear/Desbloquear real (Ativo/Inativo)
import { alterarSituacaoUsuario } from '../../../../utils/usuarios'
import { registrarAuditoria } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ situacao?: unknown }>(event)
  const atualizado = await alterarSituacaoUsuario(id, body?.situacao)
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Usuários',
    entidadeId: id,
    detalhes: `Alterou a situação de '${atualizado.nome}' para ${atualizado.status}`
  })
  return atualizado
})
