// PUT /api/usuarios/:id/situacao — Bloquear/Desbloquear real (Ativo/Inativo)
import { alterarSituacaoUsuario } from '../../../../utils/usuarios'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ situacao?: unknown }>(event)
  return await alterarSituacaoUsuario(id, body?.situacao)
})
