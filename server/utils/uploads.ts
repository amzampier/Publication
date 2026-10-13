// server/utils/uploads.ts — gravação de arquivos em uploads/<pasta>/
// A pasta uploads/ na raiz é servida em runtime via nitro.publicAssets (nuxt.config.ts).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Destinos permitidos — whitelist fechada (spec uploads: destino fora → 400). */
export const UPLOAD_DESTINOS = ['logomarcas', 'avatares'] as const
export type UploadDestino = (typeof UPLOAD_DESTINOS)[number]

export const UPLOAD_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const UPLOAD_LIMITE_BYTES = 5 * 1024 * 1024 // 5 MB (spec uploads)

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

/** Grava com colisão resolvida por sufixo -1, -2, ... (sem sobrescrever). */
export function gravarUpload(destino: UploadDestino, nome: string, dados: Buffer): string {
  const dir = join(uploadsDir(), destino)
  mkdirSync(dir, { recursive: true })

  const ponto = nome.lastIndexOf('.')
  const base = ponto > 0 ? nome.slice(0, ponto) : nome
  const ext = ponto > 0 ? nome.slice(ponto) : ''

  let final = nome
  let contador = 1
  while (existsSync(join(dir, final))) {
    final = `${base}-${contador}${ext}`
    contador++
  }
  writeFileSync(join(dir, final), dados)
  return `/uploads/${destino}/${final}`
}
