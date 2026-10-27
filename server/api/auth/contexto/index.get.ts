// GET /api/auth/contexto — contexto inicial da sessão administrativa.
// Session-only: valida a sessão uma vez e devolve usuário, shell, RBAC e avatar,
// para que o SSR e o cliente não repitam a validação em chamadas separadas.
import { obterSessaoValida, sessaoPublica } from '../../../utils/auth'
import { getConfiguracoes } from '../../../utils/configuracoes'
import { montarContextoBootstrap } from '../../../utils/contexto'
import { carregarPermissoesDaSessao } from '../../../utils/permission'
import { buscarUsuarioTelaPorId } from '../../../utils/usuarios'

export default defineEventHandler(async (event) => {
  const sessao = await obterSessaoValida(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada ou revogada.' })
  }

  const [cfg, permissoes, usuario] = await Promise.all([
    getConfiguracoes(),
    carregarPermissoesDaSessao(event),
    buscarUsuarioTelaPorId(sessao.id)
  ])

  return montarContextoBootstrap(
    sessaoPublica(sessao),
    cfg,
    permissoes,
    usuario?.avatar ?? ''
  )
})
