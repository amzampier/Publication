// Ficha Cadastral em PDF — jsPDF (A4 retrato), 1 página por usuário.
// Espelho do gerarPdfUsuarios.ts (mesma logo de login e mesmo rodapé), porém
// vertical: cada usuário do conjunto vigente ganha uma ficha com dados
// cadastrais e acesso. Fase 1: tudo em memória, sem window.print().
import { jsPDF } from 'jspdf'
import { formatarUltimoAcesso, type UsuarioDemo } from './useUsuariosDemo'

interface OpcoesFicha {
  usuarios: UsuarioDemo[]
  /** preview da logo de login: dataURL (upload) | caminho remoto | '' (marca padrão) */
  logoPreview: string
}

const MARGEM = 12
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

export const gerarPdfFichaCadastral = async (opcoes: OpcoesFicha): Promise<void> => {
  const { usuarios, logoPreview } = opcoes
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth() // 210mm
  const altura = doc.internal.pageSize.getHeight() // 297mm
  const logo = await rasterizarLogo(logoPreview)

  /** Faixa de seção navy + linhas de campo (rótulo à esquerda, valor à direita). */
  const desenharSecao = (
    titulo: string,
    yInicial: number,
    campos: [string, string][]
  ): number => {
    doc.setFillColor(...NAVY)
    doc.rect(MARGEM, yInicial, largura - MARGEM * 2, 8, 'F')
    doc.setTextColor(248, 250, 252)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(titulo, MARGEM + 3, yInicial + 5.4)

    let y = yInicial + 8
    const alturaLinha = 11
    const xRotulo = MARGEM + 3
    const xValor = MARGEM + 45
    for (const [rotulo, valor] of campos) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(rotulo, xRotulo, y + 6)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      const quebras = doc.splitTextToSize(String(valor), largura - xValor - MARGEM)
      doc.text(quebras[0] ?? String(valor), xValor, y + 6)

      y += alturaLinha
      if (rotulo !== campos[campos.length - 1][0]) {
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.1)
        doc.line(MARGEM, y, largura - MARGEM, y)
      }
    }
    return y + 6
  }

  usuarios.forEach((usuario, indice) => {
    if (indice > 0) doc.addPage()

    // ---------- Cabeçalho ----------
    let textoX = MARGEM
    if (logo) {
      const logoLargura = ALTURA_LOGO * logo.proporcao
      doc.addImage(logo.data, 'PNG', MARGEM, MARGEM, logoLargura, ALTURA_LOGO, undefined, 'FAST')
      textoX = MARGEM + logoLargura + 6
    }

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Ficha Cadastral', textoX, MARGEM + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Gerado em ${formatarUltimoAcesso(new Date().toISOString())}`, largura - MARGEM, MARGEM + 7, {
      align: 'right'
    })

    doc.setFontSize(9.5)
    doc.setTextColor(51, 65, 85)
    const y = MARGEM + 13
    doc.text(
      `Usuário ${indice + 1} de ${usuarios.length} · fase 1 em memória`,
      textoX,
      y
    )

    // Linha divisória
    const yLinha = Math.max(y + 3, MARGEM + 20)
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.5)
    doc.line(MARGEM, yLinha, largura - MARGEM, yLinha)

    // ---------- Seções ----------
    const yFimDados = desenharSecao('Dados Cadastrais', yLinha + 6, [
      ['Identificador', usuario.id],
      ['Nome', usuario.nome],
      ['E-mail', usuario.email]
    ])
    desenharSecao('Acesso ao Sistema', yFimDados + 4, [
      ['Perfil', usuario.perfil],
      ['Status', usuario.status],
      ['Último acesso', formatarUltimoAcesso(usuario.ultimoAcesso)]
    ])
  })

  // ---------- Rodapé: página X de Y em todas as páginas ----------
  const total = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 8, { align: 'right' })
    doc.text('Publications · Gestão de Usuários', MARGEM, altura - 8)
  }

  doc.save('ficha-cadastral.pdf')
}
