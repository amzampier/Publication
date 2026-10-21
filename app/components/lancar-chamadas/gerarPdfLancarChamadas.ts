// Relatórios de Lançar as Chamadas — PDF (jsPDF + autotable) e CSV do conjunto
// vigente (filtrado). Sem backend nesta fase: lê o dataset em memória.
import type { LinhaChamada } from './useLancarChamadasModelo'

const MARGEM = 10
const NAVY: [number, number, number] = [17, 32, 81] // #112051
const ALTURA_LOGO = 18 // mm

const COLUNAS = [
  'Chamada',
  'Título',
  'Software',
  'Módulo',
  'Tipo',
  'Impacto',
  'Status',
  'Lançamento',
  'Liberação'
]

const rasterizarLogo = async (src: string): Promise<{ data: string; proporcao: number } | null> => {
  if (!src) return null
  try {
    let dataUrl = src
    if (!src.startsWith('data:')) {
      const resp = await fetch(src)
      if (!resp.ok) return null
      const blob = await resp.blob()
      dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result ?? ''))
        fr.onerror = () => rej(fr.error)
        fr.readAsDataURL(blob)
      })
    }
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = () => rej(new Error('imagem inválida'))
      el.src = dataUrl
    })
    if (!img.width || !img.height) return null
    const canvas = document.createElement('canvas')
    const alturaPx = 360
    const larguraPx = Math.round((img.width / img.height) * alturaPx)
    canvas.width = larguraPx
    canvas.height = alturaPx
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, larguraPx, alturaPx)
    return { data: canvas.toDataURL('image/png'), proporcao: img.width / img.height }
  } catch {
    return null
  }
}

export interface OpcoesRelatorioChamadas {
  chamadas: LinhaChamada[]
  /** preview da logo de login: dataURL (upload) | caminho remoto | '' (marca padrão) */
  logoPreview: string
}

export const gerarPdfLancarChamadas = async (
  opcoes: OpcoesRelatorioChamadas
): Promise<void> => {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const { chamadas, logoPreview } = opcoes
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()

  const logo = await rasterizarLogo(logoPreview)
  let textoX = MARGEM
  if (logo) {
    const logoLargura = ALTURA_LOGO * logo.proporcao
    doc.addImage(logo.data, 'PNG', MARGEM, MARGEM, logoLargura, ALTURA_LOGO, undefined, 'FAST')
    textoX = MARGEM + logoLargura + 6
  }

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Relatório de Lançar as Chamadas', textoX, MARGEM + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, largura - MARGEM, MARGEM + 7, {
    align: 'right'
  })

  doc.setFontSize(9.5)
  doc.setTextColor(51, 65, 85)
  const y = MARGEM + 13
  doc.text(`${chamadas.length} chamada(s)`, textoX, y)

  const yLinha = Math.max(y + 3, MARGEM + 20)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(MARGEM, yLinha, largura - MARGEM, yLinha)

  autoTable(doc, {
    startY: yLinha + 4,
    head: [COLUNAS],
    body: chamadas.map((chamada) => [
      chamada.chamada,
      chamada.titulo,
      chamada.software,
      chamada.modulo,
      chamada.tipo,
      chamada.impacto,
      chamada.status,
      chamada.dataLancamento,
      chamada.dataLiberacao
    ]),
    margin: { left: MARGEM, right: MARGEM, top: MARGEM, bottom: MARGEM },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 1.6,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 76 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { cellWidth: 20 },
      6: { cellWidth: 26 },
      7: { cellWidth: 22 },
      8: { cellWidth: 22 }
    }
  })

  const total = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 5, { align: 'right' })
    doc.text('Publications · Lançar as Chamadas', MARGEM, altura - 5)
  }

  doc.save('lancar-chamadas.pdf')
}

const escaparCsv = (valor: string | number): string => {
  let texto = String(valor ?? '')
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

export const gerarCsvLancarChamadas = (chamadas: LinhaChamada[]): void => {
  const linhas = chamadas.map((chamada) =>
    [
      chamada.chamada,
      chamada.titulo,
      chamada.software,
      chamada.modulo,
      chamada.tipo,
      chamada.impacto,
      chamada.status,
      chamada.dataLancamento,
      chamada.dataLiberacao
    ]
      .map(escaparCsv)
      .join(';')
  )
  const csv = '\uFEFF' + [COLUNAS.map(escaparCsv).join(';'), ...linhas].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lancar-chamadas.csv'
  a.click()
  URL.revokeObjectURL(url)
}
