// Estado da página de Gestão de Usuários — fase 1 em memória (sem persistência,
// sem chamadas de rede). Campos conforme docs/02 §3.5 (tabela usuarios) restritos
// ao escopo da fase: nome, e-mail, perfil, status e último acesso.
import { computed } from 'vue'
import { useState } from '#app'

export type PerfilUsuario = 'Administrador' | 'Editor' | 'Revisor' | 'Leitor'
export type StatusUsuario = 'Ativo' | 'Inativo'

export interface UsuarioDemo {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusUsuario
  /** ISO; null = nunca acessou o sistema (exibe "-" na tabela) */
  ultimoAcesso: string | null
}

export interface FiltrosUsuarios {
  /** '' = todos */
  perfil: string
  /** '' = todos */
  status: string
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

const agora = Date.now()
// Data relativa a "hoje" — mantém o "Último acesso" sempre coerente na demo
const dataAtras = (dias: number, horas: number, minutos = 0) => {
  const d = new Date(agora - dias * 86_400_000)
  d.setHours(horas, minutos, 0, 0)
  return d.toISOString()
}

// Base de demonstração — 16 usuários cobrindo os 4 perfis e os 2 status
export const USUARIOS: UsuarioDemo[] = [
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

export const useUsuariosDemo = () => {
  const filtros = useState<FiltrosUsuarios>('usuarios-filtros', () => ({
    perfil: '',
    status: ''
  }))

  const usuariosFiltrados = computed<UsuarioDemo[]>(() => {
    const f = filtros.value
    return USUARIOS.filter((u) => {
      if (f.perfil && u.perfil !== f.perfil) return false
      if (f.status && u.status !== f.status) return false
      return true
    })
  })

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.perfil, !!f.status].filter(Boolean).length
  })

  const limparFiltros = () => {
    filtros.value = { perfil: '', status: '' }
  }

  return { filtros, usuariosFiltrados, filtrosAtivosCount, limparFiltros }
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
