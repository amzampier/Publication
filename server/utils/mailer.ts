// server/utils/mailer.ts — envio real de e-mails via Resend (REST puro, sem
// SDK). A chave vem do runtimeConfig
// (RESEND_API_KEY no .env) e nunca sai do servidor. Falhas NÃO devolvem o
// detalhe ao cliente dos fluxos genéricos (esqueci-senha vira log aqui);
// endpoints autenticados (convite) podem repassar o erro como 502.

interface EmailEnviar {
  para: string
  assunto: string
  html: string
  text: string
}

interface RespostaResend {
  id?: string
  message?: string
}

/**
 * Envia um e-mail pelo Resend. Lança Error com a mensagem do provedor quando
 * a chave é inválida, o remetente é rejeitado ou a API responde erro — o
 * chamador decide o que repassar (log vs 502).
 */
export async function enviarEmail(email: EmailEnviar): Promise<string> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey as string
  const from = config.mailFrom as string

  if (!apiKey) {
    throw new Error('[mailer] RESEND_API_KEY ausente no runtimeConfig (.env).')
  }
  if (!from) {
    throw new Error('[mailer] MAIL_FROM ausente no runtimeConfig (.env).')
  }

  const resposta = await $fetch<RespostaResend>('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      from,
      to: [email.para],
      subject: email.assunto,
      html: email.html,
      text: email.text
    }
  })

  return resposta.id ?? ''
}
