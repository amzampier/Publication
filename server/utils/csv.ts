import { Readable } from 'node:stream'
import { sendStream, setResponseHeader } from 'h3'

export function escaparCsv(valor: unknown): string {
  let texto = valor === null || valor === undefined ? '' : String(valor)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

export function csvStream(
  cabecalho: string[],
  linhas: AsyncIterable<string[]>,
  abortado: () => boolean
): Readable {
  return Readable.from(
    (async function* () {
      yield `\uFEFF${cabecalho.map(escaparCsv).join(';')}\r\n`
      for await (const linha of linhas) {
        if (abortado()) return
        yield `${linha.map(escaparCsv).join(';')}\r\n`
      }
    })(),
    { encoding: 'utf8' }
  )
}

export function enviarCsv(
  event: any,
  nomeArquivo: string,
  cabecalho: string[],
  linhas: AsyncIterable<string[]>
) {
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${nomeArquivo}"`)
  setResponseHeader(event, 'Vary', 'Accept-Encoding')
  const abortado = () => Boolean(event.node?.res?.destroyed || event.node?.res?.writableEnded)
  return sendStream(event, csvStream(cabecalho, linhas, abortado))
}