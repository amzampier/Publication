import { listarOpcoesChamadas } from '../../utils/lancar-chamadas'
import { listarOpcoesPorTipo } from '../../utils/opcoes-chamadas'
import { requirePermission } from '../../utils/permission'
import {
  TIPOS_CATALOGO_CHAMADA,
  type TipoCatalogoChamada
} from '#shared/lancar-chamadas'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'lancar-chamadas', 'visualizar')

  const consulta = getQuery(event)
  const tipo = String(consulta.tipo ?? '').trim()
  if (!tipo) return await listarOpcoesChamadas()

  if (!(TIPOS_CATALOGO_CHAMADA as readonly string[]).includes(tipo)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Catálogo inválido. Use: ${TIPOS_CATALOGO_CHAMADA.join(', ')}.`
    })
  }

  return await listarOpcoesPorTipo(
    tipo as TipoCatalogoChamada,
    String(consulta.q ?? ''),
    consulta.limite,
    consulta.pagina
  )
})
