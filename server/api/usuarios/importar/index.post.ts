// POST /api/usuarios/importar — grava linhas selecionadas (revalidação +
// transação + hash sentinela; 400 com motivos; design D4)
import { importarUsuarios } from '../../../utils/usuarios'
import { registrarAuditoria } from '../../../utils/audit'
import { validarHierarquiaPerfil } from '../../../utils/hierarquia'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'importar')
  const body = await readBody<{ linhas?: unknown }>(event)
  const linhas = Array.isArray(body?.linhas) ? body.linhas : []
  const perfis = new Set(linhas.map((linha) => (linha && typeof linha === 'object' ? String((linha as Record<string, unknown>).perfil ?? '') : '')).filter(Boolean))
  for (const perfil of perfis) await validarHierarquiaPerfil(event, perfil)
  const resultado = await importarUsuarios(body?.linhas)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Usuários',
    detalhes: `Importou ${resultado.importados} usuário(s) via planilha`
  })
  return resultado
})
