// Tipos, constantes e helpers da tela de Gestão de Usuários — o ESTADO e as
// escritas vivem em `useUsuarios.ts` (API, change gestao-usuarios-backend).
// Campos do núcleo conforme docs/02 §3.5 (tabela usuarios); telefone/função/
// departamento/endereço/SMTP/avatar/datas são o modelo estendido do modal.
export type PerfilUsuario = 'Administrador' | 'Editor' | 'Revisor' | 'Leitor'
/** Situação exibida: a API devolve Ativo/Inativo (escrita) e pode exibir Bloqueado. */
export type StatusUsuario = 'Ativo' | 'Inativo' | 'Bloqueado'
/** Modo do modal de usuário — um componente, dois usos. */
export type ModoUsuario = 'novo' | 'editar'
/** Status da Configuração de E-mail (badge do bloco SMTP — efêmero, não persiste). */
export type StatusSmtp = 'nao-testado' | 'testando' | 'conectado' | 'falha'

export interface EnderecoUsuario {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  /** Sigla da UF ('' = não informado) */
  estado: string
  regiao: string
}

export interface ConfigSmtpUsuario {
  email: string
  senha: string
  provedor: string
  servidor: string
  porta: string
  seguranca: string
  /** true quando há senha SMTP gravada no servidor (a senha nunca volta em claro — RL02 A-01) */
  temSenha?: boolean
  // O status SMTP (StatusSmtp) NÃO mora aqui: é estado efêmero de UI, donado
  // pelo ref interno de CamposSmtp (change smtp-status-estado-efemero) — a API
  // nunca envia nem devolve o campo.
}

export interface UsuarioModelo {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
  /** '' = sem senha visível (a senha real vive no banco como hash — nunca sai da API) */
  senha: string
  /** ISO; null = nunca acessou o sistema (exibe "-" na tabela) */
  ultimoAcesso: string | null
  telefone: string
  funcao: string
  departamento: string
  endereco: EnderecoUsuario
  smtp: ConfigSmtpUsuario
  /** caminho/URL do avatar (arquivo) ou dataURL no rascunho ainda não salvo; '' = sem avatar */
  avatar: string
  /** ISO; null = sem data */
  dataCadastro: string | null
  atualizadoEm: string | null
}

export interface FiltrosUsuarios {
  /** '' = todos; valor é o `nome` do usuário */
  usuario: string
  /** '' = todos */
  perfil: string
  /** '' = todos */
  status: string
}

/** Linha válida selecionada na importação de planilha — nasce sem senha (convite manual). */
export interface RegistroImportacao {
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
}

export const PERFIS: PerfilUsuario[] = ['Administrador', 'Editor', 'Revisor', 'Leitor']
/** Situações oferecidas pela UI (escrita); a leitura também tolera 'Bloqueado'. */
export const STATUSES: StatusUsuario[] = ['Ativo', 'Inativo']

export const VARIANTE_POR_PERFIL: Record<PerfilUsuario, 'reconciled' | 'inReview' | 'pending' | 'neutral'> = {
  Administrador: 'reconciled',
  Editor: 'inReview',
  Revisor: 'pending',
  Leitor: 'neutral'
}

export const VARIANTE_POR_STATUS: Record<StatusUsuario, 'done' | 'neutral' | 'blocked'> = {
  Ativo: 'done',
  Inativo: 'neutral',
  Bloqueado: 'blocked'
}

export const enderecoVazio = (): EnderecoUsuario => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  regiao: ''
})

export const smtpVazio = (): ConfigSmtpUsuario => ({
  email: '',
  senha: '',
  provedor: '',
  servidor: '',
  porta: '',
  seguranca: '',
  temSenha: false
})

/** 'dd/mm/yyyy HH:mm'; null/vazio -> '-' (nunca gravado) */
export const formatarDataHora = (iso: string | null): string => {
  if (!iso) return '-'
  return formatarUltimoAcesso(iso)
}

/** 'dd/mm/yyyy HH:mm'; null/vazio -> '-' (usuário nunca acessou) */
export const formatarUltimoAcesso = (iso: string | null): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}
