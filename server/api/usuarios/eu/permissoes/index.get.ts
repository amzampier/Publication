// GET /api/usuarios/eu/permissoes — matriz de permissões do PRÓPRIO usuário da
// sessão (session-only; alimenta o .can() do cliente). Não exige permissão de
// módulo (autoatendimento — change rbac-require-permission, D4).
import { carregarPermissoesDaSessao } from '../../../../utils/permission'
import { MODULOS_IDS } from '../../../../utils/perfis'

export default defineEventHandler(async (event) => {
  const permissoes = await carregarPermissoesDaSessao(event)
  const matriz: Record<string, string[]> = {}
  for (const modulo of MODULOS_IDS) {
    matriz[modulo] = [...(permissoes.get(modulo) ?? [])]
  }
  return { permissoes: matriz }
})
