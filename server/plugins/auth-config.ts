// Fail-fast de configuração de autenticação (design D2 — change
// auth-backend-resend): sem AUTH_JWT_SECRET o servidor não emite/valida access
// token, então o boot aborta com mensagem clara (mesma filosofia das
// migrations). A chave ausente/curta só é possível quando o .env não foi
// atualizado (o .env.example documenta as três chaves).
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const segredo = config.authJwtSecret
  const chave = config.smtpEncKey

  if (!segredo || typeof segredo !== 'string' || segredo.length < 32) {
    throw new Error(
      '[auth-config] AUTH_JWT_SECRET ausente ou fraco (mínimo 32 caracteres). ' +
        'Adicione AUTH_JWT_SECRET ao .env (veja .env.example) e reinicie o servidor.'
    )
  }

  if (!chave || typeof chave !== 'string' || chave.length < 32) {
    throw new Error(
      '[auth-config] SMTP_ENC_KEY ausente ou fraca (mínimo 32 caracteres). ' +
        'Adicione SMTP_ENC_KEY ao .env (veja .env.example) e reinicie o servidor.'
    )
  }
})
