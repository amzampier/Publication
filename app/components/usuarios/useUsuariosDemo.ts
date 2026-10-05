// Estado da página de Gestão de Usuários — fase em memória (sem persistência,
// sem chamadas de rede). Campos do núcleo conforme docs/02 §3.5 (tabela usuarios);
// telefone/função/departamento/endereço/SMTP/avatar/datas são o modelo estendido
// do modal de cadastro, documentado no docs/06 (docs/02 permanece intocado).
import { computed } from 'vue'
import { useState } from '#app'

export type PerfilUsuario = 'Administrador' | 'Editor' | 'Revisor' | 'Leitor'
export type StatusUsuario = 'Ativo' | 'Inativo'
/** Modo do modal de usuário — um componente, dois usos. */
export type ModoUsuario = 'novo' | 'editar'
/** Status da Configuração de E-mail (badge do bloco SMTP). */
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
  status: StatusSmtp
}

export interface UsuarioDemo {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
  /** ISO; null = nunca acessou o sistema (exibe "-" na tabela) */
  ultimoAcesso: string | null
  telefone: string
  funcao: string
  departamento: string
  endereco: EnderecoUsuario
  smtp: ConfigSmtpUsuario
  /** dataURL do avatar; '' = sem avatar */
  avatar: string
  /** ISO; null = ainda não gravado (criação pendente) */
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

/** Linha válida selecionada na importação de planilha — nasce sem senha (convite manual numa próxima etapa). */
export interface RegistroImportacao {
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
}

export const PERFIS: PerfilUsuario[] = ['Administrador', 'Editor', 'Revisor', 'Leitor']
export const STATUSES: StatusUsuario[] = ['Ativo', 'Inativo']

export const VARIANTE_POR_PERFIL: Record<PerfilUsuario, 'reconciled' | 'inReview' | 'pending' | 'neutral'> = {
  Administrador: 'reconciled',
  Editor: 'inReview',
  Revisor: 'pending',
  Leitor: 'neutral'
}

export const VARIANTE_POR_STATUS: Record<StatusUsuario, 'done' | 'neutral'> = {
  Ativo: 'done',
  Inativo: 'neutral'
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
  status: 'nao-testado'
})

const agora = Date.now()
// Data relativa a "hoje" — mantém o "Último acesso" sempre coerente na demo
const dataAtras = (dias: number, horas: number, minutos = 0) => {
  const d = new Date(agora - dias * 86_400_000)
  d.setHours(horas, minutos, 0, 0)
  return d.toISOString()
}

// Base de demonstração — 16 usuários cobrindo os 4 perfis e os 2 status
interface SementeUsuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
  ultimoAcesso: string | null
}

const SEMENTE: SementeUsuario[] = [
  { id: 'u-001', nome: 'Ana Carolina Ribeiro', email: 'ana.carolina@empresa.com.br', perfil: 'Administrador', status: 'Ativo', ultimoAcesso: dataAtras(0, 9, 12) },
  { id: 'u-002', nome: 'Rafael Souza', email: 'rafael.souza@empresa.com.br', perfil: 'Editor', status: 'Ativo', ultimoAcesso: dataAtras(0, 8, 47) },
  { id: 'u-003', nome: 'Mariana Lopes', email: 'mariana.lopes@empresa.com.br', perfil: 'Revisor', status: 'Ativo', ultimoAcesso: dataAtras(1, 17, 5) },
  { id: 'u-004', nome: 'Carlos Mendes', email: 'carlos.mendes@empresa.com.br', perfil: 'Administrador', status: 'Ativo', ultimoAcesso: dataAtras(1, 14, 30) },
  { id: 'u-005', nome: 'Juliana Prado', email: 'juliana.prado@empresa.com.br', perfil: 'Editor', status: 'Ativo', ultimoAcesso: dataAtras(2, 16, 22) },
  { id: 'u-006', nome: 'Paulo Roberto Tavares', email: 'paulo.tavares@empresa.com.br', perfil: 'Revisor', status: 'Ativo', ultimoAcesso: dataAtras(2, 10, 5) },
  { id: 'u-007', nome: 'Camila Rocha', email: 'camila.rocha@empresa.com.br', perfil: 'Editor', status: 'Inativo', ultimoAcesso: dataAtras(18, 14, 58) },
  { id: 'u-008', nome: 'João Lima', email: 'joao.lima@empresa.com.br', perfil: 'Revisor', status: 'Ativo', ultimoAcesso: dataAtras(3, 15, 40) },
  { id: 'u-009', nome: 'Beatriz Almeida', email: 'beatriz.almeida@empresa.com.br', perfil: 'Leitor', status: 'Ativo', ultimoAcesso: dataAtras(4, 11, 48) },
  { id: 'u-010', nome: 'Lucas Ferreira', email: 'lucas.ferreira@empresa.com.br', perfil: 'Leitor', status: 'Ativo', ultimoAcesso: dataAtras(5, 16, 10) },
  { id: 'u-011', nome: 'Paula Torres', email: 'paula.torres@empresa.com.br', perfil: 'Revisor', status: 'Ativo', ultimoAcesso: dataAtras(6, 14, 25) },
  { id: 'u-012', nome: 'Eduardo Nunes', email: 'eduardo.nunes@empresa.com.br', perfil: 'Editor', status: 'Ativo', ultimoAcesso: dataAtras(7, 10, 33) },
  { id: 'u-013', nome: 'Fernanda Dias', email: 'fernanda.dias@empresa.com.br', perfil: 'Leitor', status: 'Inativo', ultimoAcesso: dataAtras(25, 9, 5) },
  { id: 'u-014', nome: 'Marcos Vinícius Barros', email: 'marcos.barros@empresa.com.br', perfil: 'Leitor', status: 'Ativo', ultimoAcesso: dataAtras(9, 9, 44) },
  { id: 'u-015', nome: 'Sofia Mendonça', email: 'sofia.mendonca@empresa.com.br', perfil: 'Leitor', status: 'Ativo', ultimoAcesso: null },
  { id: 'u-016', nome: 'Thiago Ramos', email: 'thiago.ramos@empresa.com.br', perfil: 'Editor', status: 'Inativo', ultimoAcesso: dataAtras(30, 11, 22) }
]

/** Semente com o modelo estendido vazio — base de demonstração completa. */
export const USUARIOS: UsuarioDemo[] = SEMENTE.map((u) => ({
  ...u,
  telefone: '',
  funcao: '',
  departamento: '',
  endereco: enderecoVazio(),
  smtp: smtpVazio(),
  avatar: '',
  dataCadastro: null,
  atualizadoEm: null
}))

const clonar = (u: UsuarioDemo): UsuarioDemo => ({
  ...u,
  endereco: { ...u.endereco },
  smtp: { ...u.smtp }
})

export const useUsuariosDemo = () => {
  // Base reativa (fase 2): criado/editado em memória, perdido na recarga.
  // Clone profundo da semente — a constante USUARIOS nunca é mutada.
  const usuarios = useState<UsuarioDemo[]>('usuarios-base', () => USUARIOS.map(clonar))

  const filtros = useState<FiltrosUsuarios>('usuarios-filtros', () => ({
    usuario: '',
    perfil: '',
    status: ''
  }))

  const usuariosFiltrados = computed<UsuarioDemo[]>(() => {
    const f = filtros.value
    return usuarios.value.filter((u) => {
      if (f.usuario && u.nome !== f.usuario) return false
      if (f.perfil && u.perfil !== f.perfil) return false
      if (f.status && u.status !== f.status) return false
      return true
    })
  })

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.usuario, !!f.perfil, !!f.status].filter(Boolean).length
  })

  // Opções do select de Usuário derivam da BASE (não do conjunto filtrado):
  // um filtro de Status não pode esconder opções do select de Usuário (design D5)
  const opcoesUsuarios = computed(() =>
    [...new Set(usuarios.value.map((u) => u.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )

  const limparFiltros = () => {
    filtros.value = { usuario: '', perfil: '', status: '' }
  }

  return { usuarios, filtros, usuariosFiltrados, filtrosAtivosCount, opcoesUsuarios, limparFiltros }
}

/**
 * Grava o rascunho do modal em memória (puro): cria com id novo e datas iguais
 * ao instante; edita preservando a Data Cadastro e atualizando a Última.
 * Devolve a base nova (imutável) e o registro gravado — quem tem o `useState`
 * é quem atribui `usuarios.value = base`.
 */
export const salvarUsuario = (
  base: UsuarioDemo[],
  rascunho: UsuarioDemo,
  modo: ModoUsuario
): { base: UsuarioDemo[]; usuario: UsuarioDemo } => {
  const instante = new Date().toISOString()

  if (modo === 'novo') {
    const maiorId = base.reduce((max, u) => {
      const n = Number(u.id.replace(/\D/g, ''))
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const usuario: UsuarioDemo = {
      ...clonar(rascunho),
      id: `u-${String(maiorId + 1).padStart(3, '0')}`,
      ultimoAcesso: null,
      dataCadastro: instante,
      atualizadoEm: instante
    }
    return { base: [...base, usuario], usuario }
  }

  const original = base.find((u) => u.id === rascunho.id)
  const usuario: UsuarioDemo = {
    ...clonar(rascunho),
    dataCadastro: original?.dataCadastro ?? rascunho.dataCadastro,
    atualizadoEm: instante,
    ultimoAcesso: original?.ultimoAcesso ?? rascunho.ultimoAcesso
  }
  return { base: base.map((u) => (u.id === usuario.id ? usuario : u)), usuario }
}

/**
 * Grava os registros selecionados na importação de planilha (puro): ids na
 * sequência da base, datas iguais ao instante, campos cadastrais vazios e
 * **sem senha** (o convite será enviado manualmente numa próxima etapa).
 * Devolve a base nova (imutável) — quem tem o `useState` é quem atribui
 * `usuarios.value = base`.
 */
export const importarUsuarios = (
  base: UsuarioDemo[],
  registros: RegistroImportacao[]
): { base: UsuarioDemo[] } => {
  if (!registros.length) return { base }
  const instante = new Date().toISOString()
  let maiorId = base.reduce((max, u) => {
    const n = Number(u.id.replace(/\D/g, ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  const novos = registros.map<UsuarioDemo>((r) => {
    maiorId += 1
    return {
      id: `u-${String(maiorId).padStart(3, '0')}`,
      nome: r.nome,
      email: r.email,
      perfil: r.perfil,
      status: r.status,
      ultimoAcesso: null,
      telefone: '',
      funcao: '',
      departamento: '',
      endereco: enderecoVazio(),
      smtp: smtpVazio(),
      avatar: '',
      dataCadastro: instante,
      atualizadoEm: instante
    }
  })
  return { base: [...base, ...novos] }
}

/**
 * Remove o registro do id indicado (puro): devolve a base nova sem ele; id
 * inexistente devolve a base intacta. Quem tem o `useState` é quem atribui
 * `usuarios.value = base`.
 */
export const excluirUsuario = (
  base: UsuarioDemo[],
  id: string
): { base: UsuarioDemo[] } => ({
  base: base.filter((u) => u.id !== id)
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
