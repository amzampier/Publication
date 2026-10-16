// server/utils/uploads.ts — gravação de arquivos em uploads/<pasta>/
// A pasta uploads/ na raiz é servida em runtime via nitro.publicAssets (nuxt.config.ts).
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/** Destinos permitidos — whitelist fechada (spec uploads: destino fora → 400). */
export const UPLOAD_DESTINOS = ['logomarcas', 'avatares'] as const
export type UploadDestino = (typeof UPLOAD_DESTINOS)[number]

export const UPLOAD_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const UPLOAD_LIMITE_BYTES = 5 * 1024 * 1024 // 5 MB (spec uploads)

/**
 * Valida o CONTEÚDO real (magic bytes) — RL02 A-02: recusa HTML/SVG e afins
 * que apenas se declarem imagem. Aceita PNG, JPEG, GIF e WebP.
 */
export function ehImagemReal(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true
  // GIF: 47 49 46 38 ("GIF8")
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return true
  }
  return false
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

/** Grava com colisão resolvida por sufixo -1, -2, ... (sem sobrescrever). I/O assíncrono. */
export async function gravarUpload(destino: UploadDestino, nome: string, dados: Buffer): Promise<string> {
  const dir = join(uploadsDir(), destino)
  await mkdir(dir, { recursive: true })

  const ponto = nome.lastIndexOf('.')
  const base = ponto > 0 ? nome.slice(0, ponto) : nome
  const ext = ponto > 0 ? nome.slice(ponto) : ''

  let final = nome
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
  return `/uploads/${destino}/${final}`
}
