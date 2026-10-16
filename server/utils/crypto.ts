// server/utils/crypto.ts — cifra de segredos em repouso (change
// endurecer-sessao-segredos-e-uploads, RL02 A-01): AES-256-GCM com chave
// derivada de SMTP_ENC_KEY. Formato: `enc:v1:<base64(iv | tag | ciphertext)>`.
// Usado hoje para a senha SMTP do usuário; genérico para outros segredos.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const PREFIXO = 'enc:v1:'
const IV_BYTES = 12
const TAG_BYTES = 16

function chave(): Buffer {
  const valor = useRuntimeConfig().smtpEncKey as string
  if (!valor || typeof valor !== 'string' || valor.length < 32) {
    throw new Error('[crypto] SMTP_ENC_KEY ausente ou fraca (mínimo 32 caracteres). Veja .env.example.')
  }
  // Deriva 32 bytes exatos independentemente do tamanho da chave configurada.
  return createHash('sha256').update(valor).digest()
}

/** true quando o valor já está no formato cifrado desta aplicação. */
export function estaCifrado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.startsWith(PREFIXO)
}

/** Cifra um texto em claro; devolve string vazia quando o valor é vazio. */
export function cifrar(texto: string): string {
  if (!texto) return ''
  if (estaCifrado(texto)) return texto // idempotente
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', chave(), iv)
  const dados = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIXO + Buffer.concat([iv, tag, dados]).toString('base64')
}

/** Decifra um valor cifrado; devolve o próprio valor quando não está cifrado (legado). */
export function decifrar(valor: string): string {
  if (!estaCifrado(valor)) return valor
  const bruto = Buffer.from(valor.slice(PREFIXO.length), 'base64')
  const iv = bruto.subarray(0, IV_BYTES)
  const tag = bruto.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const dados = bruto.subarray(IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv('aes-256-gcm', chave(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(dados), decipher.final()]).toString('utf8')
}
