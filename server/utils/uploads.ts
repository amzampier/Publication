// server/utils/uploads.ts — gravação de arquivos em uploads/<pasta>/
// A pasta uploads/ na raiz é servida em runtime via nitro.publicAssets (nuxt.config.ts).
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

/** Destinos permitidos — whitelist fechada (spec uploads: destino fora → 400). */
export const UPLOAD_DESTINOS = ['logomarcas', 'avatares', 'logos', 'chamadas'] as const
export type UploadDestino = (typeof UPLOAD_DESTINOS)[number]

export const UPLOAD_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const UPLOAD_LIMITE_BYTES = 5 * 1024 * 1024 // 5 MB (spec uploads)

/** Tipos de imagem aceitos (canônicos) e a extensão segura correspondente. */
export type TipoImagem = 'png' | 'jpeg' | 'webp' | 'gif'

export const EXTENSAO_POR_TIPO: Record<TipoImagem, string> = {
  png: '.png',
  jpeg: '.jpg',
  webp: '.webp',
  gif: '.gif'
}

/**
 * Detecta o tipo real da imagem pelos magic bytes e devolve o tipo canônico
 * (ou `null`). RL04-C-01: a extensão final do arquivo passa a ser derivada
 * DESTE tipo — nunca da extensão enviada pelo cliente.
 */
export function detectarTipoImagem(buffer: Buffer): TipoImagem | null {
  if (buffer.length < 12) return null
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  // GIF: 47 49 46 38 ("GIF8")
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'gif'
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'webp'
  }
  return null
}

/**
 * O conteúdo é uma imagem real? (compatibilidade: wrapper de `detectarTipoImagem`).
 * Recusa HTML/SVG e afins que apenas se declarem imagem.
 */
export function ehImagemReal(buffer: Buffer): boolean {
  return detectarTipoImagem(buffer) !== null
}

export function uploadsDir(): string {
  return resolve(process.cwd(), 'uploads')
}

/**
 * Nome de arquivo seguro: só o basename (sem caminhos), espaços → '-',
 * caracteres fora de [a-zA-Z0-9._-] removidos, sem iniciar com ponto.
 */
export function sanitizarNomeArquivo(nome: string): string {
  const basename = nome.replace(/\\/g, '/').split('/').pop() ?? 'arquivo'
  let limpo = basename
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/^\.+/, '')
  if (!limpo) limpo = 'arquivo'
  return limpo
}

/** Remove a extensão final do nome (ex.: "evil.html" → "evil"; "foto.v2" → "foto"). */
function baseSemExtensao(nome: string): string {
  const ponto = nome.lastIndexOf('.')
  const base = ponto > 0 ? nome.slice(0, ponto) : nome
  return base || 'arquivo'
}

/**
 * Grava com a extensão canônica derivada do tipo real (RL04-C-01) e resolve
 * colisões por sufixo -1, -2, ... (sem sobrescrever). A extensão enviada pelo
 * cliente é descartada: nenhum arquivo é gravado com extensão executável.
 */
export async function gravarUpload(
  destino: UploadDestino,
  nome: string,
  dados: Buffer,
  tipo: TipoImagem,
  subpastas: string[] = []
): Promise<string> {
  const segmentos = subpastas
    .map((segmento) => segmento.trim().replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
  const partes = [destino, ...segmentos]
  const dir = join(uploadsDir(), ...partes)
  await mkdir(dir, { recursive: true })

  const ext = EXTENSAO_POR_TIPO[tipo]
  const base = baseSemExtensao(sanitizarNomeArquivo(nome))

  let final = `${base}${ext}`
  let contador = 1
  for (;;) {
    try {
      await stat(join(dir, final))
      final = `${base}-${contador}${ext}`
      contador++
    } catch {
      break // arquivo não existe: nome livre
    }
  }
  await writeFile(join(dir, final), dados)
  if (destino === 'chamadas') {
    // Variante leve para a galeria (fallback silencioso: o original continua válido).
    try {
      const baseMiniatura = baseSemExtensao(final)
      const miniatura = await sharp(dados)
        .resize({ width: 320, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer()
      await writeFile(join(dir, `${baseMiniatura}-320.webp`), miniatura)
    } catch {
      // Sem binário de imagem para resize: a galeria usa o original.
    }
  }
  return `/uploads/${partes.join('/')}/${final}`
}