import {
  listarChamadasFiltradas,
  listarChamadasPaginadas,
  type FiltrosListaChamadas
} from '../../utils/lancar-chamadas'
import { requirePermission } from '../../utils/permission'
import { enviarCsv } from '../../utils/csv'

const textoQuery = (valor: unknown): string => (typeof valor === 'string' ? valor.trim() : '')

const listaQuery = (valor: unknown): string[] => {
  if (Array.isArray(valor)) return valor.map((item) => String(item)).filter(Boolean)
  return String(valor ?? '').split(',').map((item) => item.trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const consulta = getQuery(event)
  const baixar = textoQuery(consulta.download) === '1'
  await requirePermission(event, 'lancar-chamadas', baixar ? 'download' : 'visualizar')

  const filtros: FiltrosListaChamadas = {
    busca: textoQuery(consulta.busca),
    status: textoQuery(consulta.status),
    tipo: textoQuery(consulta.tipo),
    impacto: textoQuery(consulta.impacto),
    origem: textoQuery(consulta.origem),
    parceiroId: textoQuery(consulta.parceiroId),
    softwareIds: listaQuery(consulta.softwareIds),
    dataLancamentoDe: textoQuery(consulta.dataLancamentoDe),
    dataLancamentoAte: textoQuery(consulta.dataLancamentoAte),
    dataLiberacaoDe: textoQuery(consulta.dataLiberacaoDe),
    dataLiberacaoAte: textoQuery(consulta.dataLiberacaoAte)
  }

  if (baixar && textoQuery(consulta.formato) === 'csv') {
    const cabecalho = ['Chamada', 'Título', 'Software', 'Módulo', 'Tipo', 'Impacto', 'Status', 'Lançamento', 'Liberação']
    return enviarCsv(event, 'lancar-chamadas.csv', cabecalho, (async function* () {
      let pagina = 1
      while (true) {
        const lote = await listarChamadasPaginadas({ pagina, porPagina: 200, filtros })
        for (const c of lote.itens) {
          yield [c.chamada, c.titulo, c.softwares.join(', '), c.modulo, c.tipo, c.impacto, c.status, c.dataLancamento, c.dataLiberacao]
        }
        if (lote.itens.length < 200) return
        pagina += 1
      }
    })())
  }

  if (baixar) {
    return { chamadas: await listarChamadasFiltradas(filtros) }
  }

  const pagina = Math.max(1, Number.parseInt(textoQuery(consulta.pagina) || '1', 10) || 1)
  const porPagina = Math.min(
    200,
    Math.max(1, Number.parseInt(textoQuery(consulta.porPagina) || '20', 10) || 20)
  )
  const resultado = await listarChamadasPaginadas({ pagina, porPagina, filtros })
  return { ...resultado, chamadas: resultado.itens }
})