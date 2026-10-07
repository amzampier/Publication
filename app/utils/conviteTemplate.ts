export interface DadosConvite {
  nome: string
  email: string
  perfil: string
  senha: string
  telefone: string
}

export const ASSUNTO_CONVITE = 'Convite de acesso ao Publications'

/**
 * Link absoluto de acesso — a mensagem sai do navegador, então o origin atual
 * é o destino correto (rota `/admin/login` prevista em docs/02).
 */
export function montarLinkAcesso(): string {
  if (typeof window === 'undefined') return '/admin/login'
  return `${window.location.origin}/admin/login`
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Versão em texto da mensagem — pré-visualização de WhatsApp, ação "Copiar
 * mensagem" e (no futuro) corpo do e-mail real via Resend.
 */
export function renderTextoConvite(dados: DadosConvite): string {
  const link = montarLinkAcesso()
  return [
    `Olá, ${dados.nome}!`,
    '',
    'Você foi convidado(a) a acessar o Publications.',
    '',
    `E-mail (login): ${dados.email}`,
    `Senha provisória: ${dados.senha}`,
    `Perfil: ${dados.perfil}`,
    '',
    `Acesse o sistema: ${link}`,
    '',
    'Recomendamos trocar a senha após o primeiro acesso.',
    'Se você não reconhecer este convite, ignore esta mensagem.'
  ].join('\n')
}

/**
 * Documento HTML autossuficiente (CSS inline) — pré-visualização do e-mail
 * no modal e base para um futuro envio real.
 */
export function renderHtmlConvite(dados: DadosConvite): string {
  const link = escaparHtml(montarLinkAcesso())
  const nome = escaparHtml(dados.nome)
  const email = escaparHtml(dados.email)
  const perfil = escaparHtml(dados.perfil)
  const senha = escaparHtml(dados.senha)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escaparHtml(ASSUNTO_CONVITE)}</title>
</head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(90deg,#112051 0%,#0364f7 55%,#4ed813 100%);padding:20px 28px;">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">Publications</p>
      <p style="margin:4px 0 0;color:#dbeafe;font-size:13px;">${escaparHtml(ASSUNTO_CONVITE)}</p>
    </div>
    <div style="padding:28px;color:#0f172a;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 16px;">Olá, <strong>${nome}</strong>!</p>
      <p style="margin:0 0 20px;">Você foi convidado(a) a acessar o Publications. Use as credenciais abaixo no primeiro acesso:</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <tr>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">E-mail (login)</td>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold;">${email}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Senha provisória</td>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold;">${senha}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Perfil</td>
          <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;">${perfil}</td>
        </tr>
      </table>
      <p style="margin:0 0 20px;">
        <a href="${link}" style="display:inline-block;background:#112051;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">Acessar o sistema</a>
      </p>
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;">Recomendamos trocar a senha após o primeiro acesso.</p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">Se você não reconhecer este convite, ignore esta mensagem.</p>
    </div>
    <div style="background:#112051;padding:14px 28px;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">Publications — Gestão de Publicações</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Senha provisória com a mesma régua da validação do formulário:
 * mínimo de 8 caracteres com maiúscula, minúscula, número e símbolo.
 */
export function gerarSenhaProvisoria(tamanho = 12): string {
  const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const minusculas = 'abcdefghijkmnpqrstuvwxyz'
  const numeros = '23456789'
  const simbolos = '@#$%&*!?'
  const todas = maiusculas + minusculas + numeros + simbolos

  const sorteio = (conjunto: string) => conjunto[Math.floor(Math.random() * conjunto.length)]

  const chars = [sorteio(maiusculas), sorteio(minusculas), sorteio(numeros), sorteio(simbolos)]
  while (chars.length < Math.max(8, tamanho)) chars.push(sorteio(todas))

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/**
 * Converte a máscara `(99) 99999-9999` no número do WhatsApp:
 * apenas dígitos, DDI 55 prefixado (sem duplicar quando já presente)
 * e zero à frente do DDD removido.
 */
export function normalizarTelefoneWhats(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  if (!digitos) return ''
  if (digitos.length >= 12 && digitos.startsWith('55')) return digitos
  const semZero = digitos.replace(/^0+/, '')
  return `55${semZero}`
}
