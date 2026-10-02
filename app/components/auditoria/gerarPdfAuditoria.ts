// Relatório de Auditoria em PDF — jsPDF (A4 paisagem) + jspdf-autotable.
// Fase 1: opera sobre os registros filtrados em memória; a logo de login vem do
// composable compartilhado (useLogomarcaLogin) e só entra quando houver arquivo.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatarDataHora, type FiltrosAuditoria, type RegistroAuditoria } from './useAuditoriaDemo'

interface OpcoesRelatorio {
  registros: RegistroAuditoria[]
  filtros: FiltrosAuditoria
  /** Rótulo do período vigente do composable (ex.: "01/10 – 02/10" ou "Tudo") */
  periodoRotulo: string
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
    const alturaPx = 360 // 2x para ~18mm legível
    const larguraPx = Math.round((img.width / img.height) * alturaPx)
    canvas.width = larguraPx
    canvas.height = alturaPx
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, larguraPx, alturaPx)
    return { data: canvas.toDataURL('image/png'), proporcao: img.width / img.height }
  } catch {
    return null // sem logo disponível -> só o título
  }
}

const linhaDeFiltros = (filtros: FiltrosAuditoria, periodoRotulo: string): string => {
  const partes: string[] = []
  if (periodoRotulo !== 'Tudo') partes.push(`Período: ${periodoRotulo.replace(/\u2013/g, '-')}`)
  if (filtros.usuario) partes.push(`Usuário: ${filtros.usuario}`)
  if (filtros.acao) partes.push(`Ação: ${filtros.acao}`)
  if (filtros.recurso) partes.push(`Recurso: ${filtros.recurso}`)
  return partes.length ? partes.join(' · ') : 'Sem filtros aplicados'
}

export const gerarPdfAuditoria = async (opcoes: OpcoesRelatorio): Promise<void> => {
  const { registros, filtros, periodoRotulo, logoPreview } = opcoes
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth() // 297mm
  const altura = doc.internal.pageSize.getHeight() // 210mm

  // ---------- Cabeçalho (primeira página) ----------
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
  doc.text('Relatório de Gestão de Auditoria', textoX, MARGEM + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Gerado em ${formatarDataHora(new Date().toISOString())}`, largura - MARGEM, MARGEM + 7, {
    align: 'right'
  })

  doc.setFontSize(9.5)
  doc.setTextColor(51, 65, 85)
  const larguraTexto = largura - MARGEM - textoX
  const linhasFiltro = doc.splitTextToSize(linhaDeFiltros(filtros, periodoRotulo), larguraTexto) as string[]
  let y = MARGEM + 13
  for (const linha of linhasFiltro) {
    doc.text(linha, textoX, y)
    y += 4.5
  }

  // Linha divisória
  const yLinha = Math.max(y + 1, MARGEM + 20)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(MARGEM, yLinha, largura - MARGEM, yLinha)

  // ---------- Tabela (paginação automática, cabeçalho repetido) ----------
  autoTable(doc, {
    startY: yLinha + 4,
    head: [['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes', 'IP de Origem']],
    body: registros.map((r) => [
      formatarDataHora(r.registradoEm),
      r.usuario.nome,
      r.acao,
      r.recurso,
      r.detalhes,
      r.ip
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
      0: { cellWidth: 25 },
      1: { cellWidth: 33 },
      2: { cellWidth: 24 },
      3: { cellWidth: 33 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 27 }
    }
  })

  // ---------- Rodapé: página X de Y em todas as páginas ----------
  const total = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 5, { align: 'right' })
    doc.text('Publications · Gestão de Auditoria', MARGEM, altura - 5)
  }

  doc.save('auditoria.pdf')
}