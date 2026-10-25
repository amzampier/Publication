// Evita expor stack/mensagem interna do banco em respostas 5xx. O erro completo
// continua no log do servidor; o cliente recebe uma mensagem genérica.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    if (!event) return
    const status = Number((error as { statusCode?: number }).statusCode) || 500
    if (status < 500) return
    console.error('[error]', error)
    ;(error as { message?: string }).message = 'Erro interno do servidor.'
    ;(error as { stack?: string }).stack = undefined
  })
})