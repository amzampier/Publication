import type { Component } from 'vue'
import {
  BookOpen,
  Boxes,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  LogOut,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
  User,
  Users
} from '@lucide/vue'

export interface SidebarItem {
  id: string
  label: string
  icon: Component
  /** Cor do ícone/rótulo no hover da sidebar (Tailwind não resolve cor dinâmica em classe) */
  cor?: string
  /** Rota navegável; ausente = item sem rota (só muda o estado visual) */
  to?: string
}

export interface SidebarSession {
  label: string
  aberto: boolean
  items: SidebarItem[]
}

export interface MenuItem {
  label: string
  icon: Component
  /** Cor do ícone no menu do Account (Tailwind não resolve cor dinâmica em classe) */
  cor?: string
  /** Rota navegável; ausente = item sem rota */
  to?: string
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tempo: string
}

export interface Conta {
  nome: string
  perfil: string
}

// Item raiz da sidebar, sem cabeçalho de sessão
export const itemRaiz: SidebarItem = {
  id: 'painel-executivo',
  label: 'Painel Executivo',
  icon: LayoutDashboard
}

// Cores cheias da sidebar, na mesma intensidade do menu suspenso (accountMenuItens) e do
// design system — o usuário comparou com o menu e pediu a mesma intensidade (supera os tons claros).
export const sessoes: SidebarSession[] = [
  {
    label: 'Publicações',
    aberto: true,
    items: [
      { id: 'manuais', label: 'Manuais', icon: BookOpen, cor: '#f45f71' },
      { id: 'release-week', label: 'Release Week', icon: Rocket, cor: '#1a9e07' },
      { id: 'escopo-projetos', label: 'Escopo de Projetos', icon: ClipboardList, cor: '#50a1ff' }
    ]
  },
  {
    label: 'Cadastros',
    aberto: true,
    items: [
      { id: 'parceiros', label: 'Parceiros', icon: Handshake, cor: '#047857' },
      { id: 'softwares', label: 'Softwares', icon: Boxes, cor: '#0364f7' }
    ]
  },
  {
    label: 'Administração',
    aberto: true,
    // Mesmas cores do accountMenuItens (mesmo item => mesma cor)
    items: [
      { id: 'gestao-usuarios', label: 'Gestão de Usuários', icon: Users, cor: '#b070ef' },
      { id: 'perfis-rbac', label: 'Perfis de Acesso (RBAC)', icon: ShieldCheck, cor: '#f5b302' },
      { id: 'auditoria', label: 'Auditoria', icon: ScrollText, cor: '#2dd4bf' },
      { id: 'configuracoes-globais', label: 'Configurações Globais', icon: Settings, cor: '#50a1ff', to: '/admin/configuracoes-globais' }
    ]
  }
]

export const conta: Conta = {
  nome: 'Ana Carolina Ribeiro',
  perfil: 'Super Admin'
}

// Ordem fixa do menu suspenso do Account:
// Meu Perfil -> divisor -> accountMenuItens -> divisor -> Encerrar Sessão
export const accountMeuPerfil: MenuItem = {
  label: 'Meu Perfil',
  icon: User
}

export const accountMenuItens: MenuItem[] = [
  { label: 'Configurações Globais', icon: Settings, cor: '#50a1ff', to: '/admin/configuracoes-globais' },
  { label: 'Gestão de Usuários', icon: Users, cor: '#b070ef' },
  { label: 'Configuração de Perfis (RBAC)', icon: ShieldCheck, cor: '#f5b302' },
  { label: 'Gestão de Auditoria', icon: ScrollText, cor: '#2dd4bf' }
]

export const accountEncerrarSessao: MenuItem = {
  label: 'Encerrar Sessão',
  icon: LogOut,
  cor: '#f45f71'
}

export const notificacoesIniciais: Notificacao[] = [
  {
    id: 'not-1',
    titulo: 'Conciliação bancária disponível',
    mensagem: 'O extrato do Itaú de 28/09 já está pronto para conciliação.',
    tempo: 'há 5 min'
  },
  {
    id: 'not-2',
    titulo: 'Fechamento mensal',
    mensagem: 'A filial Campinas aguarda aprovação do fechamento de setembro.',
    tempo: 'há 2 h'
  },
  {
    id: 'not-3',
    titulo: 'Novo perfil publicado',
    mensagem: 'O perfil "Analista Fiscal" foi atualizado pelo RH.',
    tempo: 'ontem'
  }
]
