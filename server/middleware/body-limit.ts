// server/middleware/body-limit.ts — RL05-M-02: barra corpos declaradamente
// grandes antes de qualquer parser (o h3 não aplica bodyLimit no multipart).
// Uploads têm limite próprio (5 MB + envelope); aqui a folga é maior.
const LIMITE_CORPO = 6 * 1024 * 1024

export default defineEventHandler((event) => {
  const metodo = String(event.method || '').toUpperCase()
  if (metodo !== 'POST' && metodo !== 'PUT' && metodo !== 'PATCH') return
  const declarado = Number(getRequestHeader(event, 'content-length') || 0)
  if (declarado > LIMITE_CORPO) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Corpo da requisição acima do limite permitido.'
    })
  }
})