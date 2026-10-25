// GET /api/auditoria — registros da trilha para a tela de Gestão de Auditoria
// (middleware auth-api.ts exige sessão: 401 sem login). Filtros estruturais por
// query param; resposta { registros, total, kpis, opcoes, pagina, porPagina } —
// opcoes do conjunto não filtrado (change auditoria-backend-integracao).
import { listarAuditoria } from '../../utils/audit'
import { funcionalidadesDeConsulta, requirePermission } from '../../utils/permission'
import { enviarCsv } from '../../utils/csv'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const inteiro = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const exportando = texto(q.exportar) === '1' || texto(q.exportar) === 'true'
  const acoes = funcionalidadesDeConsulta({
    exportar: exportando,
    busca: Boolean(texto(q.busca)),
    filtros: Boolean(
      texto(q.dataInicial) || texto(q.dataFinal) || texto(q.usuario) || texto(q.acao) || texto(q.recurso)
    )
  })
  for (const acao of acoes) await requirePermission(event, 'auditoria', acao)
  if (exportando && texto(q.formato) === 'csv') {
    const cabecalho = ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes', 'IP']
    return enviarCsv(event, 'auditoria.csv', cabecalho, (async function* () {
      let cursorData: string | undefined
      let cursorId: string | undefined
      while (true) {
        const lote = await listarAuditoria({
          dataInicial: texto(q.dataInicial),
          dataFinal: texto(q.dataFinal),
          usuario: texto(q.usuario),
          acao: texto(q.acao),
          recurso: texto(q.recurso),
          busca: texto(q.busca),
          porPagina: 200,
          cursorData,
          cursorId,
          semResumo: true
        })
        for (const r of lote.registros) {
          yield [new Date(r.registradoEm).toISOString().slice(0, 16).replace('T', ' '), r.usuario.nome, r.acao, r.recurso, r.detalhes, r.ip]
        }
        const ultimo = lote.registros.at(-1)
        if (lote.registros.length < 200 || !ultimo) return
        cursorData = ultimo.registradoEm.slice(0, 19).replace('T', ' ')
        cursorId = ultimo.id
      }
    })())
  }
  return await listarAuditoria({
    dataInicial: texto(q.dataInicial),
    dataFinal: texto(q.dataFinal),
    usuario: texto(q.usuario),
    acao: texto(q.acao),
    recurso: texto(q.recurso),
    busca: texto(q.busca),
    pagina: inteiro(q.pagina),
    porPagina: inteiro(q.porPagina),
    exportar: exportando,
    ordenar: texto(q.ordenar),
    direcao: texto(q.direcao)
  })
})
