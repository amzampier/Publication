// POST /api/usuarios/importar — grava linhas selecionadas (revalidação +
// transação + hash sentinela; 400 com motivos; design D4)
import { importarUsuarios } from '../../../utils/usuarios'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ linhas?: unknown }>(event)
  return await importarUsuarios(body?.linhas)
})
