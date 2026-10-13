// Nomes de cookie da fase 1 (fake, sem backend).
// COOKIE_SESSAO guarda apenas o id do usuário na base demo — migra para o
// cookie HttpOnly __Host-auth-token quando o servidor existir (docs/02 §3.4).
export const COOKIE_SESSAO = 'auth-sessao'

// E-mail lembrado pela checkbox "Lembrar-me" do login (apenas o e-mail).
export const COOKIE_EMAIL_LEMBRADO = 'email-lembrado'
