// Relatório de Escopo de Projetos em PDF — jsPDF (A4 paisagem) +
// jspdf-autotable. Opera sobre o conjunto vigente (filtrado + busca) da tela; a
// logo de login vem do composable compartilhado (useLogomarcaLogin) e só entra
// quando houver arquivo. Molde de parceiros/gerarPdfParceiros.ts.
import type { ProjetoEscopoModelo } from './useEscopoProjetosModelo'
import { formatarNumero, formatarPeriodo, softwaresTexto } from './validadores'

interface OpcoesRelatorio {
  escopos: ProjetoEscopoModelo[]
  /** preview da logo de login: dataURL (upload) | caminho remoto | '' (marca padrão) */
  logoPreview: string
}

const MARGEM = 10
const NAVY: [number, number, number] = [17, 32, 81] // #112051 (head da UiDataTable)
const ALTURA_LOGO = 18 // mm

/** Carrega a imagem (dataURL ou caminho remoto) e rasteriza em PNG via canvas. */
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
      el.onerror = () => rej(new Error('imagem invalida'))
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

export const gerarPdfEscopoProjetos = async (opcoes: OpcoesRelatorio): Promise<void> => {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const { escopos, logoPreview } = opcoes
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
  doc.text('Relatório de Escopo de Projetos', textoX, MARGEM + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, largura - MARGEM, MARGEM + 7, {
    align: 'right'
  })

  doc.setFontSize(9.5)
  doc.setTextColor(51, 65, 85)
  const y = MARGEM + 13
  doc.text(`${escopos.length} escopo(s)`, textoX, y)

  const yLinha = Math.max(y + 3, MARGEM + 20)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(MARGEM, yLinha, largura - MARGEM, yLinha)

  autoTable(doc, {
    startY: yLinha + 4,
    head: [
      ['Código', 'Nome', 'Versão', 'Ano', 'Status', 'Período', 'Softwares', 'Visualizações']
    ],
    body: escopos.map((escopo) => [
      escopo.codigo,
      escopo.nome,
      escopo.versao,
      String(escopo.ano),
      escopo.status,
      formatarPeriodo(escopo.dataInicio, escopo.dataFinal),
      softwaresTexto(escopo.softwaresContemplados),
      formatarNumero(escopo.totalVisualizacoes)
    ]),
    margin: { left: MARGEM, right: MARGEM, top: MARGEM, bottom: MARGEM },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 62 },
      2: { cellWidth: 22 },
      3: { cellWidth: 14 },
      4: { cellWidth: 26 },
      5: { cellWidth: 42 },
      6: { cellWidth: 55 },
      7: { cellWidth: 22 }
    }
  })

  const total = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 5, { align: 'right' })
    doc.text('Publications · Escopo de Projetos', MARGEM, altura - 5)
  }

  doc.save('escopo-projetos.pdf')
}
