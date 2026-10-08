<script setup lang="ts">
definePageMeta({ layout: false })

import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Sparkles,
  Layers,
  Palette,
  Type,
  MousePointerClick,
  Tag,
  FormInput,
  MessageSquare,
  Bell,
  ListFilter,
  CalendarDays,
  TableProperties,
  Layout,
  Printer,
  Search,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Download,
  Trash2,
  Save,
  HelpCircle,
  FileSpreadsheet,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  TrendingUp,
  Menu,
  ChevronDown as ChevronDownIcon,
  BarChart3,
  Newspaper,
  Upload,
  Calendar as CalendarIcon,
  CheckSquare,
  ToggleRight,
  LayoutGrid,
  MessageCircle,
  Smartphone,
  LoaderCircle,
  AlignLeft
} from '@lucide/vue'

import { useToast } from '../composables/useToast'
import type { ColumnDef } from '../utils/dataGrid'
import type { Notificacao } from '../config/navigation'
import {
  accountEncerrarSessao,
  accountMeuPerfil,
  accountMenuItens,
  conta,
  itemRaiz,
  notificacoesIniciais,
  sessoes
} from '../config/navigation'

// Head e SEO
useHead({
  title: 'Design System & Guia de Estilo - Publications (Dicas Teorema)',
  meta: [
    { name: 'description', content: 'Living Styleguide e catálogo de componentes do sistema Publications (Dicas Teorema).' }
  ]
})

const { toast } = useToast()

// Estados da Família Checkbox (Seção 5.9 do Guia de Estilo)
const chkReleases = ref(true)
const chkSimplesSm = ref(true)
const chkSimplesMd = ref(true)
const chkSimplesLg = ref(false)
const chkIndeterminateDemo = ref(true)
const chkPosicaoEnd = ref(true)
const chkComErro = ref(false)
const erroCheckboxMsg = ref('Você deve aceitar os termos de publicação para prosseguir.')

const chipPublicados = ref(true)
const chipBloqueados = ref(false)
const chipPendencias = ref(true)
const chipEmRevisao = ref(false)

const cardReleases = ref(true)
const cardManuais = ref(false)
const cardEscopo = ref(false)

const canaisNotificacao = ref<string[]>(['email', 'push'])
const canaisOptions = [
  { value: 'email', label: 'E-mail Institucional', description: 'Alertas de novas publicações e revisões' },
  { value: 'sms', label: 'SMS de Segurança', description: 'Notificação instantânea para bloqueios de acesso e rate limit' },
  { value: 'push', label: 'Notificação Push Web', description: 'Avisos de revisões pendentes no painel' },
  { value: 'whatsapp', label: 'WhatsApp Institucional', description: 'Envio automático de confirmações de publicação' }
]

const permissoesModulos = ref<string[]>(['releases', 'escopo'])
const permissoesOptions = [
  { value: 'releases', label: 'Releases Week Semanal', badge: 'Conteúdo', badgeVariant: 'emerald', description: 'Publicação semanal de novidades e correções' },
  { value: 'manuais', label: 'Manuais Técnicos', badge: 'Documentação', badgeVariant: 'indigo', description: 'Guias de instalação, uso e boas práticas' },
  { value: 'escopo', label: 'Escopo de Projetos', badge: 'Gestão', badgeVariant: 'lime', description: 'Acompanhamento de entregas e marcos do projeto' },
  { value: 'audit', label: 'Trilha de Auditoria', badge: 'Segurança', badgeVariant: 'rose', description: 'Logs e registros imutáveis de alterações' }
]

// Estados dos 6 Cards da Seção de Input Oficial (Conforme Mockup)
const inputBusca = ref('')
const inputSenha = ref('dicas#2026')
const showPassword = ref(false)
const inputEmail = ref('ana.ribeiro@dicasteorema.com.br')
const inputVersao = ref('v1.4.0')
const inputTitulo = ref('Release Week #40 — Correções de Exibição')
const inputSlugComErro = ref('release week 40')
const erroSlug = ref('O slug não pode conter espaços nem caracteres maiúsculos.')
// Demo da prop `mask` (docs/01 §5.3)
const inputCep = ref('')
const inputTelefone = ref('')

const publicacaoSelecionada = ref('rel-2026-w40')

// Demo do UiSegmented (seção 9)
const segmentosStatusDemo: { value: string; label: string; tone?: 'emerald' | 'slate' }[] = [
  { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
  { value: 'Inativo', label: 'Inativo', tone: 'slate' }
]
const statusSegmentado = ref('Ativo')
const statusSegmentadoDesabilitado = ref('Inativo')
const statusSegmentadoErro = ref('')
const dataSelecionadaCalendar = ref<Date | null>(new Date())
const dataPublicacao = ref<Date | null>(new Date())

// Toast - Formulário Customizado
const toastCustomTitle = ref('Release Publicada')
const toastCustomMessage = ref('A Release Week #40 foi publicada na Área Pública.')
const toastCustomType = ref<'success' | 'warning' | 'danger' | 'info'>('success')

const dispararToastCustom = () => {
  toast[toastCustomType.value](toastCustomTitle.value, toastCustomMessage.value)
}

// 8 Cores Oficiais Conforme Mockup Exato
interface ColorSwatchItem {
  title: string
  description: string
  hex: string
  bgClass: string
  badgeClass: string
  buttonClass: string
  tailwindClass: string
}

const colorSwatches: ColorSwatchItem[] = [
  {
    title: 'Navy (Ação Primária & Sidebar)',
    description: 'Botões de ação máxima, cabeçalhos executivos, sidebar',
    hex: '#112051',
    bgClass: 'bg-[#112051]',
    badgeClass: 'text-white',
    buttonClass: 'text-brand-primary',
    tailwindClass: 'bg-brand-primary'
  },
  {
    title: 'Verde Accent (Accent & Prestígio)',
    description: 'Destaques executivos, ícones e alertas',
    hex: '#4ed813',
    bgClass: 'bg-[#4ed813]',
    badgeClass: 'text-slate-950',
    buttonClass: 'text-lime-700',
    tailwindClass: 'bg-brand-accent'
  },
  {
    title: 'Verde Esmeralda (Status Positivo)',
    description: 'Status Publicado/Concluído, confirmações, dia Hoje',
    hex: '#047857',
    bgClass: 'bg-[#047857]',
    badgeClass: 'text-white',
    buttonClass: 'text-emerald-600',
    tailwindClass: 'bg-emerald-700'
  },
  {
    title: 'Vermelho Rosa (Erro & Alerta)',
    description: 'Erros, validações falhas, alertas críticos',
    hex: '#be123c',
    bgClass: 'bg-[#be123c]',
    badgeClass: 'text-white',
    buttonClass: 'text-rose-600',
    tailwindClass: 'bg-rose-700'
  },
  {
    title: 'Índigo (Revisão & Auditoria)',
    description: 'Revisão aprovada, trilha de auditoria',
    hex: '#4338ca',
    bgClass: 'bg-[#4338ca]',
    badgeClass: 'text-white',
    buttonClass: 'text-indigo-600',
    tailwindClass: 'bg-indigo-700'
  },
  {
    title: 'Rate Limit (Bloqueio 30 Minutos)',
    description: 'Suspensão automática de tentativas incorretas',
    hex: '#e11d48',
    bgClass: 'bg-[#e11d48]',
    badgeClass: 'text-white',
    buttonClass: 'text-rose-500',
    tailwindClass: 'bg-rose-600'
  },
  {
    title: 'Azul Estrutural (Estrutura Dark)',
    description: 'Superfícies de estrutura, header da grid e modal',
    hex: '#0364f7',
    bgClass: 'bg-[#0364f7]',
    badgeClass: 'text-slate-950',
    buttonClass: 'text-slate-700',
    tailwindClass: 'bg-brand-structure'
  },
  {
    title: 'Slate 50 (App Canvas)',
    description: 'Fundo principal das telas do sistema',
    hex: '#f8fafc',
    bgClass: 'bg-[#f8fafc] border border-slate-200/80',
    badgeClass: 'text-slate-700',
    buttonClass: 'text-slate-600',
    tailwindClass: 'bg-slate-50'
  }
]

const copyToClipboard = (hex: string, title: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(hex)
    toast.success('HEX Copiado', `${hex} (${title}) copiado para a área de transferência!`)
  }
}

// Dados simulados para o Select - Lista Extensa (23 publicações do catálogo)
const catalogoPublicacoes = [
  { value: 'rel-2026-w39', label: 'REL-2026-W39 — Release Week #39', badge: 'Release', description: 'Publicada em 28/09/2026 · Semana 39' },
  { value: 'rel-2026-w40', label: 'REL-2026-W40 — Release Week #40', badge: 'Release', description: 'Agendada para 05/10/2026 · Semana 40' },
  { value: 'rel-2026-w41', label: 'REL-2026-W41 — Release Week #41', badge: 'Release', description: 'Em revisão · Semana 41' },
  { value: 'rel-2026-w42', label: 'REL-2026-W42 — Release Week #42', badge: 'Release', description: 'Rascunho · Semana 42' },
  { value: 'rel-2026-w43', label: 'REL-2026-W43 — Release Week #43', badge: 'Release', description: 'Rascunho · Semana 43' },
  { value: 'man-instalacao', label: 'MAN-INSTAL — Manual de Instalação', badge: 'Manual', description: 'Guia de implantação passo a passo' },
  { value: 'man-configuracao', label: 'MAN-CONFIG — Manual de Configuração', badge: 'Manual', description: 'Parâmetros globais e preferências' },
  { value: 'man-operacao', label: 'MAN-OPERAC — Manual de Operação', badge: 'Manual', description: 'Rotinas diárias do administrador' },
  { value: 'man-integracoes', label: 'MAN-INTEG — Manual de Integrações', badge: 'Manual', description: 'APIs, webhooks e conectores' },
  { value: 'man-migracao', label: 'MAN-MIGRAC — Manual de Migração', badge: 'Manual', description: 'Atualizações entre versões' },
  { value: 'esc-portal', label: 'ESC-PORTAL — Portal de Publicações', badge: 'Escopo', description: 'Fase 2 · Em andamento' },
  { value: 'esc-busca', label: 'ESC-BUSCA — Busca & Filtros', badge: 'Escopo', description: 'Fase 1 · Concluído' },
  { value: 'esc-notificacoes', label: 'ESC-NOTIF — Notificações', badge: 'Escopo', description: 'Fase 2 · Em revisão' },
  { value: 'esc-relatorios', label: 'ESC-RELAT — Relatórios', badge: 'Escopo', description: 'Fase 3 · Planejado' },
  { value: 'esc-mobile', label: 'ESC-MOBILE — Experiência Mobile', badge: 'Escopo', description: 'Fase 3 · Planejado' },
  { value: 'esc-auditoria', label: 'ESC-AUDIT — Trilha de Auditoria', badge: 'Escopo', description: 'Fase 2 · Em andamento' },
  { value: 'esc-perfis', label: 'ESC-PERFIS — Perfis & RBAC', badge: 'Escopo', description: 'Fase 1 · Concluído' },
  { value: 'esc-temas', label: 'ESC-TEMAS — Temas & Aparência', badge: 'Escopo', description: 'Fase 3 · Planejado' },
  { value: 'guia-estilo', label: 'GUIA-DS — Guia de Estilo', badge: 'Guia', description: 'Design system e tokens oficiais' },
  { value: 'guia-conteudo', label: 'GUIA-CONTEUDO — Guia de Conteúdo', badge: 'Guia', description: 'Tom, estilo e boas práticas' },
  { value: 'faq-admin', label: 'FAQ-ADMIN — Perguntas Frequentes', badge: 'FAQ', description: 'Dúvidas da Área Administrativa' },
  { value: 'faq-publica', label: 'FAQ-PUBLICO — Perguntas Frequentes', badge: 'FAQ', description: 'Dúvidas da Área Pública' },
  { value: 'changelog', label: 'CHANGELOG — Registro de Alterações', badge: 'Histórico', description: 'Histórico completo de versões' }
]

// Projetos & Áreas responsáveis
const projetosArea = [
  { value: 'PRJ-100', label: 'PRJ-100 · Portal de Publicações', badge: 'Web', description: 'Área pública e navegação' },
  { value: 'PRJ-200', label: 'PRJ-200 · Painel Administrativo', badge: 'Admin', description: 'Cadastros e publicação' },
  { value: 'PRJ-300', label: 'PRJ-300 · Conteúdo & Manuais', badge: 'Docs', description: 'Redação e revisão técnica' },
  { value: 'PRJ-400', label: 'PRJ-400 · Escopo de Projetos', badge: 'Gestão', description: 'Entregas e marcos' },
  { value: 'PRJ-500', label: 'PRJ-500 · Segurança & Auditoria', badge: 'Sec', description: 'Perfis, acessos e trilha' }
]

// Tipos de publicação (com estado de erro)
const tiposPublicacao = [
  { value: 'release', label: 'Release Week Semanal', badge: 'Semanal', description: 'Novidades e correções da semana' },
  { value: 'manual', label: 'Manual', badge: 'Permanente', description: 'Documentação técnica de referência' },
  { value: 'escopo', label: 'Escopo de Projetos', badge: 'Projeto', description: 'Entregas, marcos e acompanhamento' },
  { value: 'guia', label: 'Guia', badge: 'Referência', description: 'Boas práticas e convenções' }
]

// Idiomas de publicação (desabilitado)
const idiomasPublicacao = [
  { value: 'pt-BR', label: 'pt-BR — Português (Padrão)', badge: 'Ativo', description: 'Idioma principal do conteúdo' },
  { value: 'en-US', label: 'en-US — Inglês', badge: 'Externo', description: 'Tradução em preparação' },
  { value: 'es-ES', label: 'es-ES — Espanhol', badge: 'Externo', description: 'Tradução em planejamento' }
]

const projetoSelecionado = ref('PRJ-200')
const tipoSelecionado = ref('')
const idiomaSelecionado = ref('pt-BR')
const erroTipo = ref('Campo obrigatório: selecione o tipo da publicação.')

// Dados e Colunas para o DataTable (DevExpress cxGrid)
interface PublicacaoGrid {
  id: string
  codigo: string
  titulo: string
  tipo: string
  projeto: string
  dataPublicacao: string
  status: 'done' | 'reconciled' | 'pending' | 'inReview' | 'blocked'
  paginas: number
  anexos: number
  downloads: number
}

const publicacoesGrid = ref<PublicacaoGrid[]>([
  // Bloco 1: Releases Week Semanal
  { id: '1', codigo: 'REL-2026-W39', titulo: 'Release Week #39 — Correções de Exibição', tipo: 'Release Week', projeto: 'Portal de Publicações', dataPublicacao: '28/09/2026', status: 'done', paginas: 12, anexos: 3, downloads: 4820 },
  { id: '2', codigo: 'REL-2026-W40', titulo: 'Release Week #40 — Busca & Filtros', tipo: 'Release Week', projeto: 'Portal de Publicações', dataPublicacao: '05/10/2026', status: 'pending', paginas: 14, anexos: 4, downloads: 3610 },
  { id: '3', codigo: 'REL-2026-W41', titulo: 'Release Week #41 — Notificações', tipo: 'Release Week', projeto: 'Painel Administrativo', dataPublicacao: '12/10/2026', status: 'inReview', paginas: 10, anexos: 2, downloads: 0 },
  { id: '4', codigo: 'REL-2026-W42', titulo: 'Release Week #42 — Relatórios', tipo: 'Release Week', projeto: 'Painel Administrativo', dataPublicacao: '19/10/2026', status: 'blocked', paginas: 16, anexos: 5, downloads: 0 },

  // Bloco 2: Manuais
  { id: '5', codigo: 'MAN-INSTAL', titulo: 'Manual de Instalação', tipo: 'Manual', projeto: 'Conteúdo & Manuais', dataPublicacao: '14/08/2026', status: 'done', paginas: 38, anexos: 6, downloads: 2140 },
  { id: '6', codigo: 'MAN-CONFIG', titulo: 'Manual de Configuração', tipo: 'Manual', projeto: 'Conteúdo & Manuais', dataPublicacao: '21/08/2026', status: 'done', paginas: 44, anexos: 8, downloads: 1875 },
  { id: '7', codigo: 'MAN-OPERAC', titulo: 'Manual de Operação', tipo: 'Manual', projeto: 'Conteúdo & Manuais', dataPublicacao: '04/09/2026', status: 'inReview', paginas: 52, anexos: 9, downloads: 1520 },
  { id: '8', codigo: 'MAN-INTEG', titulo: 'Manual de Integrações', tipo: 'Manual', projeto: 'Painel Administrativo', dataPublicacao: '18/09/2026', status: 'reconciled', paginas: 30, anexos: 4, downloads: 980 },
  { id: '9', codigo: 'MAN-MIGRAC', titulo: 'Manual de Migração de Versões', tipo: 'Manual', projeto: 'Segurança & Auditoria', dataPublicacao: '02/10/2026', status: 'pending', paginas: 26, anexos: 3, downloads: 640 },

  // Bloco 3: Escopo de Projetos
  { id: '10', codigo: 'ESC-PORTAL', titulo: 'Portal de Publicações — Fase 2', tipo: 'Escopo', projeto: 'Portal de Publicações', dataPublicacao: '30/09/2026', status: 'inReview', paginas: 8, anexos: 2, downloads: 310 },
  { id: '11', codigo: 'ESC-BUSCA', titulo: 'Busca & Filtros — Fase 1', tipo: 'Escopo', projeto: 'Portal de Publicações', dataPublicacao: '16/09/2026', status: 'done', paginas: 6, anexos: 1, downloads: 425 },
  { id: '12', codigo: 'ESC-NOTIF', titulo: 'Notificações — Fase 2', tipo: 'Escopo', projeto: 'Painel Administrativo', dataPublicacao: '07/10/2026', status: 'pending', paginas: 7, anexos: 2, downloads: 265 },
  { id: '13', codigo: 'ESC-RELAT', titulo: 'Relatórios — Fase 3', tipo: 'Escopo', projeto: 'Painel Administrativo', dataPublicacao: '21/10/2026', status: 'blocked', paginas: 9, anexos: 3, downloads: 0 },
  { id: '14', codigo: 'ESC-MOBILE', titulo: 'Experiência Mobile — Fase 3', tipo: 'Escopo', projeto: 'Portal de Publicações', dataPublicacao: '11/11/2026', status: 'pending', paginas: 11, anexos: 4, downloads: 0 },

  // Bloco 4: Guias
  { id: '15', codigo: 'GUIA-DS', titulo: 'Guia de Estilo do Design System', tipo: 'Guia', projeto: 'Conteúdo & Manuais', dataPublicacao: '12/06/2026', status: 'done', paginas: 64, anexos: 12, downloads: 3210 },
  { id: '16', codigo: 'GUIA-CONTEUDO', titulo: 'Guia de Conteúdo & Escrita', tipo: 'Guia', projeto: 'Conteúdo & Manuais', dataPublicacao: '26/06/2026', status: 'done', paginas: 28, anexos: 5, downloads: 1440 },
  { id: '17', codigo: 'GUIA-ACESS', titulo: 'Guia de Acessibilidade', tipo: 'Guia', projeto: 'Segurança & Auditoria', dataPublicacao: '10/07/2026', status: 'reconciled', paginas: 34, anexos: 7, downloads: 1265 },
  { id: '18', codigo: 'GUIA-RBAC', titulo: 'Guia de Perfis & Permissões', tipo: 'Guia', projeto: 'Segurança & Auditoria', dataPublicacao: '24/07/2026', status: 'inReview', paginas: 22, anexos: 3, downloads: 890 },

  // Bloco 5: FAQ & apoio
  { id: '19', codigo: 'FAQ-ADMIN', titulo: 'FAQ — Área Administrativa', tipo: 'FAQ', projeto: 'Painel Administrativo', dataPublicacao: '01/09/2026', status: 'done', paginas: 18, anexos: 1, downloads: 2730 },
  { id: '20', codigo: 'FAQ-PUBLICO', titulo: 'FAQ — Área Pública', tipo: 'FAQ', projeto: 'Portal de Publicações', dataPublicacao: '08/09/2026', status: 'done', paginas: 15, anexos: 1, downloads: 3120 },
  { id: '21', codigo: 'FAQ-ESCopo', titulo: 'FAQ — Escopo de Projetos', tipo: 'FAQ', projeto: 'Escopo de Projetos', dataPublicacao: '22/09/2026', status: 'reconciled', paginas: 12, anexos: 2, downloads: 760 },
  { id: '22', codigo: 'CHANGELOG-26', titulo: 'Changelog 2026 — Ano Corrente', tipo: 'Histórico', projeto: 'Painel Administrativo', dataPublicacao: '30/09/2026', status: 'done', paginas: 46, anexos: 0, downloads: 1980 },
  { id: '23', codigo: 'CHANGELOG-25', titulo: 'Changelog 2025 — Ano Anterior', tipo: 'Histórico', projeto: 'Painel Administrativo', dataPublicacao: '20/12/2025', status: 'blocked', paginas: 58, anexos: 0, downloads: 1655 }
])

const colunasDataTable: ColumnDef<PublicacaoGrid>[] = [
  { id: 'codigo', header: 'Código', accessorKey: 'codigo', sortable: true, width: 145, minWidth: 120 },
  { id: 'titulo', header: 'Título da Publicação', accessorKey: 'titulo', groupable: true, sortable: true, width: 280, minWidth: 230 },
  { id: 'tipo', header: 'Tipo', accessorKey: 'tipo', groupable: true, sortable: true, width: 160, minWidth: 130 },
  { id: 'projeto', header: 'Projeto Responsável', accessorKey: 'projeto', groupable: true, sortable: true, width: 155, minWidth: 120 },
  { id: 'dataPublicacao', header: 'Publicação em', accessorKey: 'dataPublicacao', sortable: true, width: 120, minWidth: 100 },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    align: 'center',
    sortable: true,
    width: 120,
    minWidth: 100,
    format: (val: string) =>
      (
        {
          done: 'Publicado',
          pending: 'Agendado',
          inReview: 'Em Revisão',
          blocked: 'Bloqueado'
        } as Record<string, string>
      )[val] ?? String(val)
  },
  {
    id: 'paginas',
    header: 'Páginas',
    accessorKey: 'paginas',
    align: 'right',
    isNumeric: true,
    sortable: true,
    width: 110,
    minWidth: 90,
    format: (val) => Number(val).toLocaleString('pt-BR')
  },
  {
    id: 'anexos',
    header: 'Anexos',
    accessorKey: 'anexos',
    align: 'right',
    isNumeric: true,
    sortable: true,
    width: 110,
    minWidth: 90,
    format: (val) => Number(val).toLocaleString('pt-BR')
  },
  {
    id: 'downloads',
    header: 'Downloads',
    accessorKey: 'downloads',
    align: 'right',
    isNumeric: true,
    sortable: true,
    width: 130,
    minWidth: 100,
    format: (val) => Number(val).toLocaleString('pt-BR')
  }
]

// Ação de Impressão
const handlePrint = () => {
  window.print()
}

// Shell: Sidebar retrátil com sessões colapsáveis (mesmos dados do shell real)
const sidebarOpen = ref(true)
const sidebarActiveItem = ref(itemRaiz.id)

// Cópia local dos dados de navegação: os itens vêm todos de config/navigation.ts
const sessoesDemo = sessoes.map((sessao) => ({ ...sessao, items: [...sessao.items] }))

const toggleSessao = (sessao: { aberto: boolean }) => {
  sessao.aberto = !sessao.aberto
}

// Rail não filtra por sessões abertas: o recolhimento vale só no modo expandido (bug 6.35 —
// com "Todas Recolhidas" + rail só o item raiz aparecia; o shell AppSidebar faz o mesmo)
const sessoesVisiveis = computed(() => sessoesDemo)

// Modelo da vitrine §14 (design D6): default = modelo atual (header claro + sidebar navy);
// shellTradicional = true compara com o modelo antigo (header navy + sidebar branca).
// Ícone/--item-cor sobre navy usam as tintas D9 60/40 via tinta() (design D2) — as cores
// cheias foram calibradas para fundo branco e quebram 3:1 sobre #112051.
const shellTradicional = ref(false)

// Account do header (bloco + menu suspenso) — mesma fonte do shell real
const accountMenuAberto = ref(false)
const accountRef = ref<HTMLElement | null>(null)

// Sino da demo §14 (design D6) — mesma fonte e comportamento do AppHeader
const notificacoesAberto = ref(false)
const notificacoesRef = ref<HTMLElement | null>(null)
const notificacoes = ref<Notificacao[]>([...notificacoesIniciais])

const alternarMenuAccount = () => {
  accountMenuAberto.value = !accountMenuAberto.value
  notificacoesAberto.value = false
}

const alternarNotificacoes = () => {
  notificacoesAberto.value = !notificacoesAberto.value
  accountMenuAberto.value = false
}

const fecharMenuAccount = () => {
  accountMenuAberto.value = false
}

const visualizarNotificacao = (id: string) => {
  notificacoes.value = notificacoes.value.filter((notificacao) => notificacao.id !== id)
}

const limparNotificacoes = () => {
  notificacoes.value = []
}

const fecharMenuSeFora = (evento: PointerEvent) => {
  const alvo = evento.target as Node
  if (accountMenuAberto.value && accountRef.value && !accountRef.value.contains(alvo)) {
    accountMenuAberto.value = false
  }
  if (notificacoesAberto.value && notificacoesRef.value && !notificacoesRef.value.contains(alvo)) {
    notificacoesAberto.value = false
  }
}

const fecharMenuComEscape = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') {
    accountMenuAberto.value = false
    notificacoesAberto.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', fecharMenuSeFora)
  document.addEventListener('keydown', fecharMenuComEscape)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', fecharMenuSeFora)
  document.removeEventListener('keydown', fecharMenuComEscape)
})

// Upload de arquivos & Câmera Web (Seção 6)
const cameraAberta = ref(false)
const avatarFoto = ref('')

function aoFotoCapturada(dataUrl: string) {
  avatarFoto.value = dataUrl
  cameraAberta.value = false
}

function aoChangeAvatar() {
  avatarFoto.value = ''
}

// Demo do Modal de Cadastro (Seção 15 do Guia)
const modalDemoAberto = ref(false)
const modalDemoTitulo = ref('Release Week #40 — Correções de Exibição')
const modalDemoSlug = ref('release-week-2026-w40')
const modalDemoEmail = ref('conteudo@dicasteorema.com.br')
const modalDemoPeriodicidade = ref('semanal')
const modalDemoData = ref('')
const modalDemoPeriodicidadeOpcoes = [
  { value: 'avulsa', label: 'Publicação avulsa' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' }
]

const fecharModalDemo = () => {
  modalDemoAberto.value = false
}

const salvarModalDemo = () => {
  modalDemoAberto.value = false
  toast.success('Publicação de Demonstração', 'Os dados do modal de exemplo foram salvos (apenas demo).')
}

// Demo de modal filho (empilhamento — docs/01 §5.12): abre um modal xs sobre o
// modal de cadastro; Escape/Tab devem atingir somente o topo da pilha.
const modalFilhoAberto = ref(false)
const modalFilhoCampo = ref('conteúdo do modal filho')

// Demo de modal de confirmação destrutiva (docs/06 §5.6): UiModal sm com rodapé
// outline + danger, no mesmo padrão do modal de exclusão de usuário.
const modalConfirmacaoAberto = ref(false)
const confirmarDemoExclusao = () => {
  modalConfirmacaoAberto.value = false
  toast.success('Exclusão de Demonstração', 'Registro excluído (apenas demo).')
}

// Demo da Seção 16 — UiTabs + UiSlider
// Demo da Seção 13 — botão Filtros da toolbar do UiDataTable (contador demonstrativo)
const filtrosDemo = ref(0)
const abrirFiltrosDemo = () => {
  filtrosDemo.value = filtrosDemo.value ? 0 : 2
  toast.info(
    'Filtros',
    filtrosDemo.value
      ? '2 filtros aplicados — demonstração do contador no botão.'
      : 'Filtros limpos — contador zerado.'
  )
}

const tabsDemoAba = ref('design')
const tabsDemoAbas = [
  { id: 'design', label: 'Design Tokens', icon: Palette, cor: '#7c3aed' },
  { id: 'acessibilidade', label: 'Acessibilidade', icon: Eye, cor: '#0364f7' },
  { id: 'conteudo', label: 'Conteúdo', icon: Newspaper, cor: '#112051' },
  { id: 'seguranca', label: 'Segurança', icon: Lock, cor: '#be123c' }
]
const sliderDemoDias = ref(180)
const sliderDemoMarks = [
  { value: 30, label: '30 dias (1 mês)' },
  { value: 90, label: '90 dias (Trimestre)' },
  { value: 180, label: '180 dias (Semestre)' },
  { value: 365, label: '365 dias (1 ano)' },
  { value: 730, label: '730 dias (2 anos)' }
]

// Demonstração do UiChoiceCard (seção 17) — três grupos com estados iniciais distintos
const choiceCardVazio = ref('')
const choiceCardSky = ref('email')
const choiceCardEmerald = ref('whatsapp')
const choiceCardCanais = [
  {
    value: 'email',
    title: 'E-mail',
    description: 'Abre o cliente de e-mail padrão com a mensagem pronta.',
    icon: Mail,
    tone: 'sky'
  },
  {
    value: 'whatsapp',
    title: 'WhatsApp',
    description: 'Abre o aplicativo desktop com a mensagem preenchida.',
    icon: MessageCircle,
    tone: 'emerald'
  }
]
const choiceCardCanaisComSms = [
  ...choiceCardCanais,
  {
    value: 'sms',
    title: 'SMS',
    description: 'Envio por mensagem de texto curta.',
    icon: Smartphone,
    tone: 'indigo',
    disabled: true,
    disabledHint: 'Canal previsto para uma próxima fase.'
  }
]

// Demo do UiLoading (Seção 18) — o componente não fecha sozinho (clique/Escape não
// fecham), então a demo desmonta o overlay com um timer e limpa ao desmontar a página.
// O modo progresso incrementa `loadingProgressCurrent` via setInterval (~100 ms) até
// `LOADING_TOTAL`, sincronizado com o auto-fecho de ~3,5 s.
const loadingDemo = ref(false)
const loadingDemoComProgresso = ref(false)
const LOADING_TOTAL = 5000
const loadingProgressCurrent = ref(0)
let loadingDemoTimer: ReturnType<typeof setTimeout> | null = null
let loadingDemoInterval: ReturnType<typeof setInterval> | null = null

const encerrarLoadingDemo = () => {
  loadingDemo.value = false
  loadingDemoComProgresso.value = false
  if (loadingDemoTimer) {
    clearTimeout(loadingDemoTimer)
    loadingDemoTimer = null
  }
  if (loadingDemoInterval) {
    clearInterval(loadingDemoInterval)
    loadingDemoInterval = null
  }
}

const abrirLoadingDemo = (comProgresso: boolean) => {
  if (loadingDemoTimer) clearTimeout(loadingDemoTimer)
  if (loadingDemoInterval) clearInterval(loadingDemoInterval)
  loadingDemoComProgresso.value = comProgresso
  loadingDemo.value = true
  if (comProgresso) {
    loadingProgressCurrent.value = 0
    const passo = Math.ceil(LOADING_TOTAL / 35)
    loadingDemoInterval = setInterval(() => {
      loadingProgressCurrent.value = Math.min(
        LOADING_TOTAL,
        loadingProgressCurrent.value + passo
      )
    }, 100)
  }
  loadingDemoTimer = setTimeout(encerrarLoadingDemo, 3500)
}

onUnmounted(encerrarLoadingDemo)

// Demo do UiTextarea (Seção 19) — campo livre com v-model e exemplo fixo em erro
const textareaDemo = ref('')
const textareaErroDemo = 'Informe a descrição.'

// Navegação rápida de âncoras
const secoes = [
  { id: 'principios', label: '1. Princípios & Tipografia' },
  { id: 'cores', label: '2. Cores & Tokens' },
  { id: 'botoes', label: '3. Botões de Ação' },
  { id: 'badges', label: '4. Badges (Zero-Pill)' },
  { id: 'inputs', label: '5. Inputs & Validação' },
  { id: 'upload', label: '6. Upload & Câmera' },
  { id: 'tooltips', label: '7. Tooltips' },
  { id: 'toasts', label: '8. Toasts & Alertas' },
  { id: 'select', label: '9. Select com Busca' },
  { id: 'data', label: '10. Data & Calendário' },
  { id: 'checkbox', label: '11. Família Checkbox (5.9)' },
  { id: 'kpi', label: '12. Cards de Indicadores (Kpi)' },
  { id: 'datatable', label: '13. DataTable (cxGrid)' },
  { id: 'shell', label: '14. Shell & Impressão' },
  { id: 'modal', label: '15. Modal de Cadastro' },
  { id: 'tabs-slider', label: '16. Tabs & Slider' },
  { id: 'choice-card', label: '17. Cards de Escolha (UiChoiceCard)' },
  { id: 'loading', label: '18. Loading (UiLoading)' },
  { id: 'textarea', label: '19. Textarea (UiTextarea)' }
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Header Fixo de Apresentação do Design System (Full-Width Fluido) -->
    <header class="sticky top-0 z-40 bg-brand-primary border-b border-slate-800 text-white shadow-md no-print">
      <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div class="flex items-center gap-3 min-w-0">
          <div class="p-2 rounded-lg bg-lime-500/10 border border-lime-500/30 text-brand-accent">
            <Building2 class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-bold tracking-tight text-white">Publications Design System</h1>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-500/20 text-lime-300 border border-lime-500/30">
                v2.0.0
              </span>
            </div>
            <p class="text-[11px] text-slate-400">Diretrizes de UI/UX de Publicações (Nuxt 4 + Tailwind CSS)</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UiButton variant="outline" size="sm" class="bg-brand-primary-raised text-slate-200 border-slate-700 hover:bg-brand-primary" @click="handlePrint">
            <template #leftIcon><Printer class="h-3.5 w-3.5" /></template>
            Imprimir Guia
          </UiButton>
          <a
            href="/"
            class="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>Home</span>
            <ExternalLink class="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>

    <!-- Layout Principal: Índice Lateral + Conteúdo das Seções (Full-Width Fluido sem restrição estática) -->
    <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 flex-1 flex flex-col lg:flex-row gap-8">
      <!-- Índice Fixo / Âncoras Rápidas -->
      <aside class="lg:w-64 shrink-0 no-print">
        <div class="sticky top-24 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers class="h-3.5 w-3.5 text-lime-500" />
            Navegação do Guia
          </h2>
          <nav class="flex flex-col gap-1 text-xs">
            <a
              v-for="sec in secoes"
              :key="sec.id"
              :href="`#${sec.id}`"
              class="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
            >
              {{ sec.label }}
            </a>
          </nav>

          <div class="mt-4 pt-4 border-t border-slate-100">
            <div class="text-[11px] text-slate-400">
                Padrão Oficial: <strong class="text-slate-700">Navy #112051 & Azul Claro #0364f7</strong>
            </div>
          </div>
        </div>
      </aside>

      <!-- Conteúdo Principal -->
      <main class="flex-1 flex flex-col gap-12 min-w-0">
        <!-- 1. PRINCÍPIOS FUNDAMENTAIS & TIPOGRAFIA -->
        <section id="principios" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-brand-primary text-brand-accent">
              <Type class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">1. Princípios de Design & Tipografia Oficial</h2>
              <p class="text-xs text-slate-500">Clareza da informação, disciplina anti-slop e precisão numérica tabular.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Escala Tipográfica -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Escala de Títulos & Corpo</h3>
              
              <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span class="text-[10px] text-slate-400 font-mono">H1 · Plus Jakarta Sans 24px Bold</span>
                <h1 class="text-2xl font-bold text-slate-900 mt-1">Painel Executivo de Publicações</h1>
              </div>

              <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span class="text-[10px] text-slate-400 font-mono">H2 · Plus Jakarta Sans 18px Bold</span>
                <h2 class="text-lg font-bold text-slate-900 mt-1">Releases Week Semanal & Manuais</h2>
              </div>

              <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span class="text-[10px] text-slate-400 font-mono">H3 · Plus Jakarta Sans 14px Semibold</span>
                <h3 class="text-sm font-semibold text-slate-800 mt-1">Publicações em Revisão (Semana #39)</h3>
              </div>

              <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span class="text-[10px] text-slate-400 font-mono">Body · Plus Jakarta Sans 13px Regular</span>
                <p class="text-xs text-slate-600 mt-1">
                  Metadados e históricos de publicação com separadores sutis · REL-2026-W39 · Publicado
                </p>
              </div>
            </div>

            <!-- Tipografia Numérica Tabular -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Precisão Numérica (JetBrains Mono)</h3>
              
              <div class="p-4 rounded-xl border border-lime-200 bg-lime-50/30">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-lime-900">Alinhamento Tabular</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-lime-100 text-lime-800">font-variant-numeric: tabular-nums</span>
                </div>
                <div class="font-mono tabular-nums text-right space-y-1.5 text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                  <div class="flex justify-between border-b border-slate-100 pb-1">
                    <span class="font-sans text-slate-500">Publicações anteriores:</span>
                    <span class="font-bold">1.250</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-100 pb-1 text-emerald-700">
                    <span class="font-sans text-slate-500">Publicadas (+):</span>
                    <span class="font-bold">+ 48</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-100 pb-1 text-rose-700">
                    <span class="font-sans text-slate-500">Arquivadas (-):</span>
                    <span class="font-bold">- 12</span>
                  </div>
                  <div class="flex justify-between pt-1 text-slate-900 font-bold text-sm bg-slate-50 px-2 py-1 rounded">
                    <span class="font-sans">Total vigente:</span>
                    <span>1.286</span>
                  </div>
                </div>
              </div>

              <div class="p-3 rounded-lg border border-slate-200 bg-slate-100 text-[11px] text-slate-600">
                <strong>Anti-Slop & Disciplina Zero-Pill:</strong> Categorias e metadados não utilizam cápsulas arredondadas excessivas (<code class="text-slate-800">rounded-full</code>). Badges utilizam rigorosamente <code class="text-slate-800">rounded-md</code>.
              </div>
            </div>
          </div>
        </section>

        <!-- 2. PALETA DE CORES SEMÂNTICAS -->
        <section id="cores" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-start gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <Palette class="h-5 w-5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <h2 class="text-base font-bold text-slate-900 tracking-tight">
                2. Paleta de Cores Semânticas de Status & Governança
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Identidade corporativa Navy #112051 com Verde #4ed813 e estados semânticos de publicação.
              </p>
            </div>
          </div>

          <!-- Grade de 8 Cards Oficiais (4 colunas x 2 linhas) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="color in colorSwatches"
              :key="color.hex"
              class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow"
            >
              <!-- Bloco de Cor Retangular Superior -->
              <div
                :class="[
                  'h-[90px] w-full rounded-lg p-2.5 flex items-end select-none',
                  color.bgClass
                ]"
              >
                <span :class="['text-[11px] font-mono font-semibold tracking-tight', color.badgeClass]">
                  {{ color.hex }}
                </span>
              </div>

              <!-- Título e Descrição da Aplicação -->
              <div class="flex flex-col gap-0.5 mt-0.5">
                <h3 class="text-[12px] font-bold text-slate-900 leading-tight">
                  {{ color.title }}
                </h3>
                <p class="text-[11px] text-slate-400 leading-relaxed">
                  {{ color.description }}
                </p>
              </div>

              <!-- Rodapé do Card: Classe Tailwind & Copiar HEX -->
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                <code class="text-[11px] text-blue-500 font-mono">
                  {{ color.tailwindClass }}
                </code>
                <button
                  type="button"
                  :class="[
                    'text-[11px] font-semibold hover:underline cursor-pointer focus:outline-none transition-colors',
                    color.buttonClass
                  ]"
                  @click="copyToClipboard(color.hex, color.title)"
                >
                  Copiar HEX
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. BOTÕES (BUTTON VARIANTS) -->
        <section id="botoes" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-brand-primary text-white">
              <MousePointerClick class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">3. Botões Corporativos (Button.vue)</h2>
              <p class="text-xs text-slate-500">Ações primárias, neutras, destrutivas e auxiliares.</p>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Grid de Variantes -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Variantes Oficiais</h3>
              <div class="flex flex-wrap items-center gap-3">
                <UiButton variant="primary">
                  <template #leftIcon><Save class="h-3.5 w-3.5" /></template>
                  Salvar Alterações (Primário)
                </UiButton>

                <UiButton variant="outline">
                  <template #leftIcon><Download class="h-3.5 w-3.5" /></template>
                  Exportar CSV (Outline)
                </UiButton>

                <UiButton variant="danger">
                  <template #leftIcon><Trash2 class="h-3.5 w-3.5" /></template>
                  Excluir Registro (Destrutivo)
                </UiButton>

                <UiButton variant="accent">
                  <template #leftIcon><Sparkles class="h-3.5 w-3.5" /></template>
                  Editar Extras JSON (Acento)
                </UiButton>
              </div>
            </div>

            <!-- Estados Especiais -->
            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tamanhos & Estados</h3>
              <div class="flex flex-wrap items-center gap-3">
                <UiButton variant="primary" size="sm">Pequeno (sm)</UiButton>
                <UiButton variant="primary" size="md">Médio Padrão (md)</UiButton>
                <UiButton variant="primary" size="lg">Grande (lg)</UiButton>
                <UiButton variant="primary" loading>Processando...</UiButton>
                <UiButton variant="primary" disabled>Desabilitado</UiButton>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. BADGES DE STATUS (ZERO-PILL) -->
        <section id="badges" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-emerald-700 text-white">
              <Tag class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">4. Badges de Status (Disciplina Zero-Pill)</h2>
              <p class="text-xs text-slate-500">Geometria <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-800">rounded-md</code>, nunca cápsulas exageradas.</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Concluído</span>
              <UiBadge variant="done" />
            </div>

            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Legada (reservada)</span>
              <UiBadge variant="reconciled" />
            </div>

            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Pendente</span>
              <UiBadge variant="pending" />
            </div>

            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Em Análise</span>
              <UiBadge variant="inReview" />
            </div>

            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Bloqueado (Pulse)</span>
              <UiBadge variant="blocked" />
            </div>

            <div class="p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-2 text-center">
              <span class="text-[10px] text-slate-400">Neutro</span>
              <UiBadge variant="neutral">Semana 39</UiBadge>
            </div>
          </div>
        </section>

        <!-- 5. COMPONENTE INPUT OFICIAL -->
        <section id="inputs" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Cabeçalho Idêntico ao Mockup -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-4 mb-6">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  5. Componente Input Oficial (Foco Verde #1a9e07 & Ícones Configuráveis)
                </h2>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Ao receber o foco, a borda inferior e seus dois cantos arredondados destacam-se na cor <span class="font-mono text-lime-700 font-semibold">#1a9e07</span>. Suporta ícone ao lado esquerdo e/ou direito com ação de clique e máscara de digitação (<code class="font-mono">mask</code>).
              </p>
            </div>
            <div class="min-w-0">
              <span class="px-2.5 py-1 rounded text-xs font-mono font-medium bg-lime-50 text-lime-800 border border-lime-200">
                Componente: &lt;Input /&gt;
              </span>
            </div>
          </div>

          <!-- Grade de 6 Cards Exatos (3 colunas x 2 linhas) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Card 1: ÍCONE À ESQUERDA (LEFTICON) -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  ÍCONE À ESQUERDA (LEFTICON)
                </div>
                <UiInput
                  v-model="inputBusca"
                  label="Pesquisar Publicação ou Código"
                  placeholder="Digite para buscar..."
                  :left-icon="Search"
                  :force-focus="true"
                />
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                Clique no campo para ver a borda inferior em #1a9e07
              </p>
            </div>

            <!-- Card 2: ÍCONE À DIREITA COM AÇÃO (RIGHTICON) -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  ÍCONE À DIREITA COM AÇÃO (RIGHTICON)
                </div>
                <UiInput
                  v-model="inputSenha"
                  :type="showPassword ? 'text' : 'password'"
                  label="Senha de Acesso Corporativo"
                  placeholder="••••••••"
                  :left-icon="Lock"
                  :right-icon="showPassword ? EyeOff : Eye"
                  @right-icon-click="showPassword = !showPassword"
                />
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                Ícone direito interativo para alternar visualização
              </p>
            </div>

            <!-- Card 3: AMBOS OS ÍCONES (LEFTICON & RIGHTICON) -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  AMBOS OS ÍCONES (LEFTICON & RIGHTICON)
                </div>
                <UiInput
                  v-model="inputEmail"
                  label="E-mail Corporativo Autenticado"
                  :left-icon="Mail"
                >
                  <template #rightIcon>
                    <CheckCircle2 class="h-4 w-4 text-emerald-600" />
                  </template>
                </UiInput>
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                E-mail validado pelo diretório corporativo
              </p>
            </div>

            <!-- Card 4: MONO COM JETBRAINS MONO -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  MONO COM JETBRAINS MONO
                </div>
                <UiInput
                  v-model="inputVersao"
                  label="Versão da Publicação"
                  :mono="true"
                  :right-icon="CalendarIcon"
                >
                  <template #leftIcon>
                    <span class="text-emerald-600 font-bold font-mono text-sm leading-none pl-0.5">v</span>
                  </template>
                </UiInput>
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                Formatação numérica com suporte a tabular-nums
              </p>
            </div>

            <!-- Card 5: PADRÃO (SEM ÍCONE) -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  PADRÃO (SEM ÍCONE)
                </div>
                <UiInput
                  v-model="inputTitulo"
                  label="Título da Publicação"
                />
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                Campos padrão herdam o mesmo foco #1a9e07
              </p>
            </div>

            <!-- Card 6: VALIDAÇÃO COM ÍCONE & TOOLTIP -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2.5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    VALIDAÇÃO COM ÍCONE & TOOLTIP
                  </span>
                  <span class="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    Tooltip no Ícone
                  </span>
                </div>
                <UiInput
                  v-model="inputSlugComErro"
                  label="Slug da URL (Amostra com Erro)"
                  label-class="text-rose-700"
                  :error="erroSlug"
                  :left-icon="Building2"
                />
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                Passe o mouse sobre o ícone de exclamação vermelho à direita para visualizar a mensagem de erro.
              </p>
            </div>

            <!-- Card 7: MÁSCARA DE DIGITAÇÃO (MASK) -->
            <div class="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  MÁSCARA DE DIGITAÇÃO (MASK)
                </div>
                <div class="grid gap-4">
                  <UiInput v-model="inputCep" label="CEP" mask="99999-999" placeholder="00000-000" />
                  <UiInput
                    v-model="inputTelefone"
                    label="Telefone"
                    mask="(99) 99999-9999"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <p class="text-[11px] text-slate-400 mt-3 font-normal">
                A digitação formata na hora (<code class="font-mono">9</code> = dígito,
                <code class="font-mono">A</code> = alfanumérico) e o <code class="font-mono">v-model</code>
                recebe a string já formatada.
              </p>
            </div>
          </div>

          <!-- Rodapé de Especificação Técnica -->
          <div class="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 text-slate-600">
              <span class="font-bold text-slate-700">Implementação no Código:</span>
              <code class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]">
                import { Input } from '../common/Input';
              </code>
            </div>

            <div class="text-lime-700 font-semibold text-xs">
              Destaque de foco: Borda inferior & cantos inferiores arredondados em #1a9e07
            </div>
          </div>
        </section>

        <!-- 6. UPLOAD DE ARQUIVOS & CÂMERA WEB -->
        <section id="upload" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-indigo-600 text-white">
              <Upload class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">6. Upload de Arquivos, Avatares & Logos (UploadFiles & CameraWeb)</h2>
              <p class="text-xs text-slate-500">Área com bordas pontilhadas para arrastar ou clicar; sem faixa de rodapé — no canto inferior direito ficam só os ícones (incluir, foto e excluir), aparecendo no hover; o nome do arquivo aparece abaixo da prévia. O modo <b>lista separada</b> mostra os arquivos em cards acima da caixa; no modo single-file a caixa some enquanto houver arquivo selecionado (volta ao remover) e no modo múltiplo permanece para acrescentar mais.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <!-- Avatar com câmera -->
            <div class="p-4 border border-slate-200 rounded-lg">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Avatar</span>
              <UiUploadFiles
                class="mt-2"
                rotulo="Foto do perfil"
                dica="PNG ou JPG até 5MB"
                sugestao="Dimensão sugerida: 300 × 400 px"
                forma="retrato"
                :preview="avatarFoto"
                alt="Foto do perfil"
                @change="aoChangeAvatar"
                @camera="cameraAberta = true"
              />
            </div>

            <!-- Logo -->
            <div class="p-4 border border-slate-200 rounded-lg">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Logo</span>
              <UiUploadFiles
                class="mt-2"
                rotulo="Logotipo da empresa"
                dica="SVG ou PNG transparente"
                sugestao="Dimensão sugerida: 400 × 160 px"
                forma="retangular"
                aceitar="image/*"
                :mostrar-camera="false"
              />
            </div>

            <!-- Múltiplos arquivos -->
            <div class="p-4 border border-slate-200 rounded-lg">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Arquivos</span>
              <UiUploadFiles
                class="mt-2"
                rotulo="Anexos de documentos"
                dica="Qualquer formato, vários arquivos"
                multiple
                :mostrar-camera="false"
              />
            </div>

            <!-- Lista separada (modo opt-in) -->
            <div class="p-4 border border-slate-200 rounded-lg">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lista separada</span>
              <UiUploadFiles
                class="mt-2"
                lista-separada
                rotulo="Clique para selecionar arquivos"
                dica="Formatos aceitos: .pdf, .xlsx"
                :mostrar-camera="false"
              />
            </div>
          </div>
        </section>

        <!-- 7. COMPONENTE TOOLTIP OFICIAL -->
        <section id="tooltips" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-brand-primary-raised text-white">
              <MessageSquare class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">7. Componente Tooltip Oficial</h2>
              <p class="text-xs text-slate-500">Micro-feedback contextual com 4 direções, micro-seta geométrica e tema dark.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-around gap-6 py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
            <UiTooltip content="Tooltip na posição superior (Topo)" position="top">
              <UiButton variant="outline">
                <template #leftIcon><HelpCircle class="h-3.5 w-3.5 text-lime-500" /></template>
                Posição Topo
              </UiButton>
            </UiTooltip>

            <UiTooltip content="Tooltip na posição inferior (Rodapé)" position="bottom">
              <UiButton variant="outline">
                <template #leftIcon><HelpCircle class="h-3.5 w-3.5 text-lime-500" /></template>
                Posição Rodapé
              </UiButton>
            </UiTooltip>

            <UiTooltip content="Tooltip no lado esquerdo" position="left">
              <UiButton variant="outline">
                <template #leftIcon><HelpCircle class="h-3.5 w-3.5 text-lime-500" /></template>
                Lado Esquerdo
              </UiButton>
            </UiTooltip>

            <UiTooltip content="Tooltip no lado direito" position="right">
              <UiButton variant="outline">
                <template #leftIcon><HelpCircle class="h-3.5 w-3.5 text-lime-500" /></template>
                Lado Direito
              </UiButton>
            </UiTooltip>
          </div>
        </section>

        <!-- 8. SISTEMA DE TOASTS -->
        <section id="toasts" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5 min-w-0">
              <div class="p-1.5 rounded-lg bg-lime-500 text-slate-950 shrink-0 mt-0.5">
                <Bell class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  8. Sistema Oficial de Toasts (Sucess, Warning, Danger e Info)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Notificações estruturadas com <strong class="text-slate-700">Header</strong> (ícone à esquerda + título), <strong class="text-slate-700">Body</strong> (mensagem clara ao usuário),
                  <span class="text-blue-500 font-medium">cores suaves</span> e bordas finas.
                </p>
              </div>
            </div>
            <div class="min-w-0">
              <span class="px-2.5 py-1 rounded text-xs font-mono font-medium bg-lime-50 text-lime-800 border border-lime-200 whitespace-nowrap">
                Componente: &lt;Toast /&gt; &amp; useToast()
              </span>
            </div>
          </div>

          <!-- Vitrine Visual dos 4 Tipos -->
          <div class="mb-5">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Vitrine Visual dos 4 Tipos (Cores Suaves &amp; Bordas Finas)</span>
              <span class="font-normal text-slate-400 normal-case tracking-normal">Renderização direta dos componentes no design system</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Sucess -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span class="font-semibold text-slate-700">Sucess</span>
                  <span class="ml-auto font-mono text-slate-400">type="success"</span>
                </div>
                <div class="relative rounded-xl border border-emerald-200 border-b-emerald-400 bg-emerald-50 p-3.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="p-1 rounded-md bg-emerald-100 shrink-0">
                        <CheckCircle2 class="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-emerald-950 leading-tight">Operação Concluída com Sucesso</p>
                        <span class="text-[10px] font-mono text-emerald-700">14:32</span>
                      </div>
                    </div>
                  </div>
                  <p class="mt-2 ml-7 text-[10px] text-emerald-800 leading-relaxed">
                    A Release Week #39 foi publicada e distribuída para a Área Pública.
                  </p>
                </div>
              </div>

              <!-- Warning -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span class="w-2 h-2 rounded-full bg-lime-500 shrink-0"></span>
                  <span class="font-semibold text-lime-700">Warning</span>
                  <span class="ml-auto font-mono text-slate-400">type="warning"</span>
                </div>
                <div class="relative rounded-xl border border-lime-200 border-b-brand-accent bg-lime-50 p-3.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="p-1 rounded-md bg-lime-100 shrink-0">
                        <AlertTriangle class="h-4 w-4 text-lime-700" />
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-lime-950 leading-tight">Atenção aos Prazos de Publicação</p>
                        <span class="text-[10px] font-mono text-lime-700">14:30</span>
                      </div>
                    </div>
                  </div>
                  <p class="mt-2 ml-7 text-[10px] text-lime-800 leading-relaxed">
                    O prazo da Releases Week encerra em 48 horas. Revise as pendências de conteúdo.
                  </p>
                </div>
              </div>

              <!-- Danger -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span class="font-semibold text-rose-700">Danger</span>
                  <span class="ml-auto font-mono text-slate-400">type="danger"</span>
                </div>
                <div class="relative rounded-xl border border-rose-200 border-b-rose-400 bg-rose-50 p-3.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="p-1 rounded-md bg-rose-100 shrink-0">
                        <AlertOctagon class="h-4 w-4 text-rose-600" />
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-rose-950 leading-tight">Erro Crítico de Processamento</p>
                        <span class="text-[10px] font-mono text-rose-700">14:28</span>
                      </div>
                    </div>
                  </div>
                  <p class="mt-2 ml-7 text-[10px] text-rose-800 leading-relaxed">
                    Falha na validação do conteúdo enviado. A publicação não pôde ser concluída.
                  </p>
                </div>
              </div>

              <!-- Info -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span class="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                  <span class="font-semibold text-sky-700">Info</span>
                  <span class="ml-auto font-mono text-slate-400">type="info"</span>
                </div>
                <div class="relative rounded-xl border border-sky-200 border-b-sky-400 bg-sky-50 p-3.5 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="p-1 rounded-md bg-sky-100 shrink-0">
                        <Info class="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-sky-950 leading-tight">Sincronização do Sistema</p>
                        <span class="text-[10px] font-mono text-sky-700">14:25</span>
                      </div>
                    </div>
                  </div>
                  <p class="mt-2 ml-7 text-[10px] text-sky-800 leading-relaxed">
                    Novo manual disponível no catálogo para consulta em todas as áreas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Centro de Disparo Interativo -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Bell class="h-4 w-4 text-lime-500" />
                <span class="text-xs font-bold text-slate-900">Centro de Disparo Interativo (Experimente na Tela Agora)</span>
              </div>
              <span class="text-[11px] text-slate-400">Clique para acionar notificações reais no canto superior direito do sistema</span>
            </div>

            <!-- Botões de Disparo Rápido -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <UiButton
                variant="outline"
                @click="toast.success('Operação Concluída com Sucesso', 'A Release Week #39 foi publicada e distribuída para a Área Pública.')"
              >
                <template #leftIcon><CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /></template>
                Disparar Sucess
              </UiButton>

              <UiButton
                variant="outline"
                @click="toast.warning('Atenção aos Prazos de Publicação', 'O prazo da Releases Week encerra em 48 horas. Revise as pendências de conteúdo.')"
              >
                <template #leftIcon><AlertTriangle class="h-3.5 w-3.5 text-lime-700" /></template>
                Disparar Warning
              </UiButton>

              <UiButton
                variant="danger"
                @click="toast.danger('Erro Crítico de Processamento', 'Falha na validação do conteúdo enviado. A publicação não pôde ser concluída.')"
              >
                <template #leftIcon><AlertOctagon class="h-3.5 w-3.5" /></template>
                Disparar Danger
              </UiButton>

              <UiButton
                variant="outline"
                @click="toast.info('Sincronização do Sistema', 'Novo manual disponível no catálogo para consulta em todas as áreas.')"
              >
                <template #leftIcon><Info class="h-3.5 w-3.5 text-sky-700" /></template>
                Disparar Info
              </UiButton>
            </div>

            <!-- Formulário Customizado -->
            <div class="flex items-end gap-2 flex-wrap">
              <div class="flex-1 min-w-[160px]">
                <UiInput
                  v-model="toastCustomTitle"
                  label="Título Customizado do Header"
                  placeholder="Ex: Release Aprovada"
                />
              </div>

              <div class="flex-[2] min-w-[220px]">
                <UiInput
                  v-model="toastCustomMessage"
                  label="Mensagem do Usuário no Body"
                  placeholder="Ex: As publicações foram atualizadas..."
                />
              </div>

              <div class="min-w-[140px]">
                <UiSelect
                  v-model="toastCustomType"
                  label="Tipo"
                  :options="[
                    { value: 'success', label: 'Sucess' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'danger', label: 'Danger' },
                    { value: 'info', label: 'Info' }
                  ]"
                  :clearable="false"
                />
              </div>

              <UiButton variant="primary" @click="dispararToastCustom">
                <template #leftIcon><Sparkles class="h-3.5 w-3.5" /></template>
                Disparar Personalizado
              </UiButton>
            </div>
          </div>

          <!-- Rodapé de Implementação -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 text-slate-600">
              <span class="font-semibold text-slate-700">Implementação no Código:</span>
              <code class="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]">
                const { toast } = useToast(); toast.success('Título', 'Mensagem...');
              </code>
            </div>
            <span class="text-slate-400 text-[11px]">
              Padrão estético: Cores suaves pastéis + Borda fina de 1px + Barra de progresso discreta
            </span>
          </div>
        </section>

        <!-- 9. SELECT COM BUSCA EM TEMPO REAL -->
        <section id="select" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5 min-w-0">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <ListFilter class="h-4 w-4" />
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base font-bold text-slate-900 tracking-tight">
                    9. Componente de Seleção do Design System (&lt;Select /&gt;)
                  </h2>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-lime-100 text-lime-800 border border-lime-200">Localização por Digitação</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Componente de seleção estilizado com busca em tempo real para conjuntos densos de dados, navegação por teclado, foco inferior em
                  <span class="font-mono font-semibold text-lime-700">#1a9e07</span> e suporte a ícones, descrições e badges.
                </p>
              </div>
            </div>
            <div class="shrink-0 text-[11px] text-slate-500 text-right whitespace-nowrap">
              <span class="font-medium text-lime-700">Foco: #1a9e07</span>
              <span class="mx-1 text-slate-300">·</span>
              <span>Total Demo: <strong class="text-slate-800">{{ catalogoPublicacoes.length }} opções</strong></span>
            </div>
          </div>

          <!-- Grid de 3 Colunas -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

            <!-- COLUNA 1: Lista Extensa com Busca -->
            <div class="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-lime-500"><ListFilter class="h-3.5 w-3.5" /></span>
                  <span class="text-xs font-bold text-slate-900">Lista Extensa com Busca</span>
                </div>
                <span class="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  {{ catalogoPublicacoes.length }} publicações
                </span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed -mt-1">
                Clique para abrir e digite palavras como “release”, “manual”, “escopo” ou “FAQ” para filtrar instantaneamente.
              </p>
              <UiSelect
                v-model="publicacaoSelecionada"
                label="Publicação de Referência"
                :options="catalogoPublicacoes"
                placeholder="Selecione a publicação..."
                search-placeholder="Digitar para localizar publicações..."
                helper-text="Filtro instantâneo por código, título ou categoria."
              />
            </div>

            <!-- COLUNA 2: Com Ícone e Badges -->
            <div class="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <TableProperties class="h-3.5 w-3.5 text-slate-500" />
                  <span class="text-xs font-bold text-slate-900">Projetos &amp; Áreas Responsáveis</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Com Badges</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed -mt-1">
                Integração com ícone de representação setorial e tags identificadoras de área responsável.
              </p>
              <UiSelect
                v-model="projetoSelecionado"
                label="Projeto Responsável"
                :options="projetosArea"
                placeholder="Selecionar projeto..."
                search-placeholder="Buscar por código ou nome..."
                helper-text="Atribuição de responsabilidade editorial."
              >
                <template #leftIcon>
                  <TableProperties class="h-4 w-4 text-slate-400" />
                </template>
              </UiSelect>

              <div v-if="projetoSelecionado" class="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span class="text-slate-500">Selecionado:</span>
                <span class="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">{{ projetoSelecionado }}</span>
              </div>
            </div>

            <!-- COLUNA 3: Validação e Erro -->
            <div class="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <AlertTriangle class="h-3.5 w-3.5 text-rose-500" />
                  <span class="text-xs font-bold text-slate-900">Estados de Validação &amp; Bloqueio</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">Tratamento de Erros</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed -mt-1">
                Feedback visual automático para campos obrigatórios não preenchidos ou estados inativos.
              </p>

              <UiSelect
                v-model="tipoSelecionado"
                label="Tipo de Publicação (Com Erro) *"
                label-class="text-rose-700"
                :options="tiposPublicacao"
                placeholder="Selecione o tipo..."
                search-placeholder="Buscar tipo..."
                :error="erroTipo"
              />

              <UiSelect
                v-model="idiomaSelecionado"
                label="Idioma do Conteúdo (Desabilitado)"
                :options="idiomasPublicacao"
                placeholder="Selecionar idioma..."
                search-placeholder="Buscar idioma..."
                :disabled="true"
                helper-text="Bloqueado: traduções liberadas apenas pela equipe editorial."
              />
            </div>
          </div>

          <!-- Controle Segmentado (UiSegmented) -->
          <div class="mt-5 border border-slate-200 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ToggleRight class="h-3.5 w-3.5 text-slate-500" />
                <span class="text-xs font-bold text-slate-900">Controle Segmentado (&lt;UiSegmented /&gt;)</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700 border border-sky-200">Escolha Única sem Dropdown</span>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed mt-1 mb-3">
              Opções em uma única linha, um único ponto de parada de <code class="font-mono">Tab</code>, setas/Home/End para alternar e os recortes de foco
              <span class="font-mono font-semibold text-lime-700">#1a9e07</span> / erro <span class="font-mono font-semibold text-rose-700">rose-700</span> do kit —
              usado pelo campo Status do modal de usuário.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <UiSegmented
                v-model="statusSegmentado"
                label="Status"
                :options="segmentosStatusDemo"
              />
              <UiSegmented
                v-model="statusSegmentadoDesabilitado"
                label="Status (desabilitado)"
                :options="segmentosStatusDemo"
                :disabled="true"
              />
              <UiSegmented
                v-model="statusSegmentadoErro"
                label="Status (erro)"
                :options="segmentosStatusDemo"
                error="Selecione o status."
              />
            </div>
          </div>

          <!-- Rodapé -->
          <div class="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div class="flex flex-wrap items-center gap-2 min-w-0 text-slate-600">
              <span class="font-semibold text-slate-700">Implementação no Código:</span>
              <code class="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]">
                &lt;Select v-model="{val}" :options="opts" @change="{setVal}" searchPlaceholder="Digitar..." /&gt;
              </code>
            </div>
            <span class="text-slate-400 text-[11px]">
              Destaque ao focar: Borda inferior arredondada em <strong class="text-lime-700 font-mono">#1a9e07</strong>
            </span>
          </div>
        </section>

        <!-- 10. DATA & CALENDÁRIO OFICIAL -->
        <section id="data" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-[#047857] text-white">
              <CalendarDays class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">10. Data & Calendário Oficial (DatePicker & Calendar)</h2>
              <p class="text-xs text-slate-500">Destaque mandatório do dia atual ("Hoje") em verde esmeralda <code class="font-mono font-bold text-emerald-800">#047857</code>.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">DatePicker (Popover com Máscara)</h3>
              <UiDatePicker
                v-model="dataPublicacao"
                label="Data de Publicação"
                placeholder="DD/MM/AAAA"
                helper-text="Digite a data com máscara automática ou selecione pelo calendário"
              />
            </div>

            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Calendar (Modo Embutido Inline)</h3>
              <UiCalendar
                v-model="dataSelecionadaCalendar"
              />
            </div>
          </div>
        </section>

        <!-- 11. FAMÍLIA DE COMPONENTES DE SELEÇÃO CHECKBOX (SEÇÃO 5.9) -->
        <section id="checkbox" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Cabeçalho Oficial -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-4 mb-6">
            <div class="flex items-start gap-2.5 min-w-0">
              <div class="p-1.5 rounded-lg bg-lime-500 text-slate-950 shrink-0 mt-0.5">
                <CheckSquare class="h-4 w-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-slate-900 tracking-tight">
                    11. Família de Componentes de Seleção &amp; Marcação (Checkbox)
                  </h2>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-lime-100 text-lime-800 border border-lime-200">
                    Seção 5.9 do Guia
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Controles unificados para formulários, filtros analíticos e seleção rica corporativa com suporte a tri-state, cores oficiais e layouts variados.
                </p>
              </div>
            </div>
            <div class="min-w-0">
              <span class="px-2.5 py-1 rounded text-xs font-mono font-medium bg-lime-50 text-lime-800 border border-lime-200">
                &lt;Checkbox /&gt;, &lt;BadgeCheckbox /&gt;, &lt;CheckChip /&gt;, &lt;CheckCard /&gt;, &lt;CheckboxGroup /&gt;
              </span>
            </div>
          </div>

          <!-- Grade de Demonstração em 4 Blocos -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- BLOCO 1: Checkbox Normal, Tamanhos & Tri-State -->
            <div class="border border-slate-200 rounded-xl p-4.5 bg-slate-50/30 flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                  1. Checkbox Simples, Tamanhos &amp; Tri-State
                </span>
                <span class="text-[10px] font-mono text-slate-400">sm (14px) · md (16px) · lg (20px)</span>
              </div>

              <!-- Tamanhos -->
              <div class="space-y-3 bg-white p-3 rounded-lg border border-slate-200/80">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamanhos Disponíveis:</div>
                <div class="flex flex-wrap items-center gap-5">
                  <UiCheckbox
                    v-model="chkSimplesSm"
                    size="sm"
                    label="Pequeno (sm - 14px)"
                    description="Para grids compactos"
                  />
                  <UiCheckbox
                    v-model="chkSimplesMd"
                    size="md"
                    label="Médio Padrão (md - 16px)"
                    description="Formulários corporativos"
                  />
                  <UiCheckbox
                    v-model="chkSimplesLg"
                    size="lg"
                    label="Grande (lg - 20px)"
                    description="Modais de confirmação"
                  />
                </div>
              </div>

              <!-- Tri-State e Posição -->
              <div class="space-y-3 bg-white p-3 rounded-lg border border-slate-200/80">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tri-State e Alinhamento:</div>
                <div class="flex flex-col gap-2.5">
                  <UiCheckbox
                    :model-value="false"
                    :indeterminate="chkIndeterminateDemo"
                    label="Seleção Parcial (Tri-State)"
                    description="Exibe traço (-) quando o grupo possui itens parcialmente marcados"
                    @change="chkIndeterminateDemo = !chkIndeterminateDemo"
                  />

                  <div class="pt-2 border-t border-slate-100">
                    <UiCheckbox
                      v-model="chkPosicaoEnd"
                      checkbox-position="end"
                      label="Posição Invertida (checkboxPosition='end')"
                      description="Ideal para listas de configuração e opções alinhadas à direita"
                    />
                  </div>
                </div>
              </div>

              <!-- Validação com Erro -->
              <div class="bg-white p-3 rounded-lg border border-slate-200/80">
                <UiCheckbox
                  v-model="chkComErro"
label="Concordo com os termos de governança e política editorial *"
:error="!chkComErro ? erroCheckboxMsg : ''"
variant="lime"
                />
              </div>
            </div>

            <!-- BLOCO 2: Variantes de Cor Corporativas & BadgeCheckbox -->
            <div class="border border-slate-200 rounded-xl p-4.5 bg-slate-50/30 flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  2. Variantes de Cor &amp; BadgeCheckbox
                </span>
                <span class="text-[10px] font-mono text-slate-400">Tokens Semânticos Oficiais</span>
              </div>

              <!-- Grade de 6 Cores -->
              <div class="space-y-3 bg-white p-3 rounded-lg border border-slate-200/80">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">6 Variantes de Cor:</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <UiCheckbox :model-value="true" variant="lime" label="Verde (#1a9e07)" />
                  <UiCheckbox :model-value="true" variant="slate" label="Slate 900" />
                  <UiCheckbox :model-value="true" variant="emerald" label="Emerald (Publicado)" />
                  <UiCheckbox :model-value="true" variant="indigo" label="Índigo (Revisão)" />
                  <UiCheckbox :model-value="true" variant="rose" label="Rose (Erro)" />
                  <UiCheckbox :model-value="true" variant="sky" label="Sky (Informação)" />
                </div>
              </div>

              <!-- BadgeCheckbox -->
              <div class="space-y-3 bg-white p-3 rounded-lg border border-slate-200/80">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  BadgeCheckbox (&lt;BadgeCheckbox /&gt;):
                </div>
                <p class="text-[11px] text-slate-500 -mt-1">
                  Combina o checkbox a uma tag de contexto institucional ou nível de permissão RBAC.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <UiBadgeCheckbox
                    v-model="chkReleases"
                    label="Releases Week Semanal"
                    badge="Conteúdo"
                    badge-variant="emerald"
                  />
                  <UiBadgeCheckbox
                    :model-value="true"
                    label="Gestor de Conteúdo"
                    badge="MASTER"
                    badge-variant="slate"
                  />
                  <UiBadgeCheckbox
                    :model-value="true"
                    label="Trilha de Auditoria"
                    badge="Auditoria"
                    badge-variant="indigo"
                  />
                  <UiBadgeCheckbox
                    :model-value="false"
                    label="Bloqueio Rate Limit"
                    badge="Segurança"
                    badge-variant="rose"
                  />
                </div>
              </div>
            </div>

            <!-- BLOCO 3: CheckChip (Filtros Rápidos para Tabelas e Grids) -->
            <div class="border border-slate-200 rounded-xl p-4.5 bg-slate-50/30 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  3. CheckChip / BadgeCheck (Filtros Rápidos cxGrid)
                </span>
                <span class="text-[10px] font-mono text-slate-400">Toggle Chips com Contador</span>
              </div>
              <p class="text-[11px] text-slate-500">
                O próprio badge atua como botão de alternância com check animado e contador de registros.
              </p>

              <div class="flex flex-wrap items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200/80">
                <UiCheckChip
                  v-model="chipPublicados"
                  label="Publicados"
                  :count="42"
                  variant="emerald"
                />
                <UiCheckChip
                  v-model="chipBloqueados"
                  label="Bloqueados"
                  :count="18"
                  variant="rose"
                />
                <UiCheckChip
                  v-model="chipPendencias"
label="Pendências"
:count="7"
variant="lime"
                />
                <UiCheckChip
                  v-model="chipEmRevisao"
                  label="Em Revisão"
                  :count="89"
                  variant="indigo"
                />
                <UiCheckChip
                  :model-value="true"
                  label="Filtro Desabilitado"
                  :count="0"
                  :disabled="true"
                />
              </div>
            </div>

            <!-- BLOCO 4: CheckCard (Seleção Rica de Tipos de Publicação) -->
            <div class="border border-slate-200 rounded-xl p-4.5 bg-slate-50/30 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                  4. CheckCard (Cartões Ricos de Seleção)
                </span>
                <span class="text-[10px] font-mono text-slate-400">Tipos de Publicação</span>
              </div>
              <p class="text-[11px] text-slate-500">
                Cartões interativos com realce visual de borda e fundo ao selecionar.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <UiCheckCard
                  v-model="cardReleases"
                  title="Releases Week Semanal"
                  description="Publicação semanal de novidades"
                  badge="Ativa"
                  badge-variant="emerald"
                  :icon="Newspaper"
                />
                <UiCheckCard
                  v-model="cardManuais"
                  title="Manuais"
                  description="Documentação técnica de referência"
                  badge="Permanente"
                  badge-variant="neutral"
                  :icon="FileSpreadsheet"
                />
                <UiCheckCard
                  v-model="cardEscopo"
                  title="Escopo de Projetos"
                  description="Entregas, marcos e acompanhamento"
                  badge="Atenção"
                  badge-variant="lime"
                  :icon="Layers"
                />
              </div>
            </div>

            <!-- BLOCO 5: CheckboxGroup com "Selecionar Todos" Tri-State Automático (Largura Total) -->
            <div class="lg:col-span-2 border border-slate-200 rounded-xl p-4.5 bg-slate-50/30 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                  5. CheckboxGroup com "Selecionar Todos" Tri-State Automático
                </span>
                <span class="text-[10px] font-mono text-slate-400">&lt;CheckboxGroup showSelectAll /&gt;</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-200/80">
                <!-- Grupo 1: Notificações -->
                <div>
                  <UiCheckboxGroup
                    v-model="canaisNotificacao"
                    label="Canais de Notificação do Conteúdo (Layout Grid-2)"
:options="canaisOptions"
:show-select-all="true"
layout="grid-2"
variant="lime"
                  />
                  <div class="mt-3 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    Selecionados: <strong class="text-slate-800">{{ canaisNotificacao }}</strong>
                  </div>
                </div>

                <!-- Grupo 2: Módulos com Badge -->
                <div>
                  <UiCheckboxGroup
                    v-model="permissoesModulos"
                    label="Módulos de Publicação e Governança (Tipo Badge)"
                    :options="permissoesOptions"
                    :show-select-all="true"
                    layout="vertical"
                    type="badge"
                    variant="slate"
                  />
                  <div class="mt-3 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    Módulos Ativos: <strong class="text-slate-800">{{ permissoesModulos }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 12. CARDS DE INDICADORES (Kpi) -->
        <section id="kpi" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-blue-600 text-white">
              <BarChart3 class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">12. Cards de Indicadores (Kpi.vue)</h2>
              <p class="text-xs text-slate-500">Cartão de métrica com borda temática, ícone opcional, variação abaixo do valor e ondas animadas no rodapé.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <UiKpi titulo="Downloads no Mês" valor="48.320" cor="#2161ef" :icone="TrendingUp" metrica="+8,4%" metrica-rotulo="vs. mês anterior" tendencia="up" />
            <UiKpi titulo="Publicações Publicadas" valor="128" cor="#059669" :icone="FileSpreadsheet" metrica="-3,1%" metrica-rotulo="vs. mês anterior" tendencia="down" />
            <UiKpi titulo="Em Revisão" valor="37" cor="#d97706" :icone="Clock" metrica="12 hoje" tendencia="neutral" />
            <UiKpi titulo="Pendências de Conteúdo" valor="8 alertas" cor="#e11d48" :icone="AlertTriangle" metrica="+2 nesta semana" tendencia="down" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <UiKpi titulo="Catálogo Total" valor="1.286 itens" metrica="+82" metrica-rotulo="nos últimos 30 dias" tendencia="up" />
            <UiKpi titulo="Itens Bloqueados" valor="12" cor="#4f46e5" metrica="5 há muito tempo" tendencia="down" />
            <UiKpi titulo="Taxa de Publicação" valor="94,2%" cor="#112051" metrica="+1,8 p.p." tendencia="up" />
          </div>
        </section>

        <!-- 13. DATATABLE CORPORATIVO (DevExpress cxGrid) -->
        <section id="datatable" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-6">
            <div class="p-2 rounded-lg bg-brand-primary text-brand-accent">
              <TableProperties class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">13. DataTable Corporativo (Padrão DevExpress cxGrid)</h2>
              <p class="text-xs text-slate-500">Group By Box com Drag &amp; Drop de cabeçalhos, ordenação multi-coluna com Shift+clique e totalizadores no rodapé.</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-3.5 bg-lime-50/70 border border-lime-200 rounded-xl text-xs text-lime-950 flex items-start gap-2.5">
              <Sparkles class="h-4 w-4 text-lime-700 shrink-0 mt-0.5" />
              <div>
                <strong class="text-lime-950 font-bold">Recursos cxGrid implementados (Teste agora na grade abaixo):</strong>
                <ul class="list-disc list-inside mt-1.5 space-y-1 text-[11px] text-lime-900">
                  <li><strong>Group By Box com Drag &amp; Drop:</strong> Clique e <strong>arraste qualquer cabeçalho de coluna</strong> (ex: Tipo, Projeto, Status) para dentro da caixa pontilhada superior para criar árvores hierárquicas em até 3 níveis.</li>
                  <li><strong>Ordenação Multi-Coluna (Multi-Sort):</strong> Clique em um cabeçalho para ordenar. Segure a tecla <kbd class="px-1.5 py-0.5 bg-white border border-lime-300 rounded font-mono font-bold text-[10px]">Shift</kbd> e clique em outra coluna para adicionar ordenação secundária com indicador de prioridade (ex: 1, 2).</li>
                  <li><strong>Totalizadores sob Demanda no Rodapé:</strong> Clique com o <strong>botão direito do mouse</strong> sobre qualquer célula do rodapé (ex: Downloads) para escolher a operação (Soma, Média, Contagem, Mínimo ou Máximo).</li>
                </ul>
              </div>
            </div>

            <!-- Tabela cxGrid em Largura Completa -->
            <UiDataTable
              title="Catálogo de Publicações (Demonstrativo Integrado)"
              subtitle="Exemplo com dados reais: arraste até 3 colunas para o topo, clique com botão direito no rodapé para calcular, teste ordenação e ações."
              :data="publicacoesGrid"
              :columns="colunasDataTable"
              :initial-grouped-columns="['tipo', 'projeto']"
              :default-page-size="5"
              show-header-top
              show-filters
              :filters-count="filtrosDemo"
              @open-filters="abrirFiltrosDemo"
            >
              <!-- Slot customizado para célula de status -->
              <template #cell(status)="{ value }">
                <UiBadge :variant="value" size="sm" />
              </template>
            </UiDataTable>
          </div>
        </section>

        <!-- 14. SHELL DE LAYOUT & IMPRESSÃO -->
        <section id="shell" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5 min-w-0">
              <div class="p-1.5 rounded-lg bg-brand-primary text-white shrink-0 mt-0.5">
                <Layout class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  14. Arquitetura de Layout Bimodal: Header Claro + Sidebar Navy
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Demonstração da barra superior executiva com central de notificações, bloco de
                  Account e menu suspenso,
                  alternância de sidebar (expandida
                  <code class="font-mono text-slate-700">'w-52'</code> /
                  rail <code class="font-mono text-slate-700">'w-[46px]'</code>) e sessões de menu
                  colapsáveis individualmente.
                </p>
              </div>
            </div>

            <!-- Comparação de modelos (só vitrine): alterna a demo, o shell real segue o modelo atual -->
            <div class="flex items-center gap-1.5 shrink-0" role="group" aria-label="Modelo do shell da demonstração">
              <UiButton
                size="sm"
                :variant="shellTradicional ? 'outline' : 'primary'"
                :aria-pressed="!shellTradicional"
                @click="shellTradicional = false"
              >
                Atual
              </UiButton>
              <UiButton
                size="sm"
                :variant="shellTradicional ? 'primary' : 'outline'"
                :aria-pressed="shellTradicional"
                @click="shellTradicional = true"
              >
                Antigo (comparação)
              </UiButton>
            </div>
          </div>

          <!-- Demo do Shell -->
          <div class="border border-slate-200 rounded-xl overflow-hidden" :class="{ 'ds-shell-antigo': shellTradicional }">

            <!-- Header: modelo atual (claro) por padrão; com ds-shell-antigo volta ao navy -->
            <div
              :class="[
                'flex items-center justify-between px-4 h-16',
                shellTradicional ? 'bg-brand-primary text-[#f8fafc]' : 'bg-white border-b border-slate-200 text-slate-900'
              ]"
            >
              <div class="flex items-center min-w-0">
                <!-- Toggle Sidebar -->
                <button
                  type="button"
                  class="mr-3 hover:opacity-75 transition-opacity p-1 rounded"
                  aria-label="Alternar sidebar"
                  @click="sidebarOpen = !sidebarOpen"
                >
                  <Menu class="h-4 w-4" aria-hidden="true" />
                </button>
                <!-- Logo -->
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      'p-1.5 rounded-md',
                      shellTradicional ? 'bg-lime-500/15 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'
                    ]"
                  >
                    <Building2 class="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span class="text-sm font-bold tracking-tight">Publications</span>
                </div>
              </div>

              <div class="flex items-center gap-2.5">
                <!-- Sino de notificações (demonstração — espelha o AppHeader) -->
                <div ref="notificacoesRef" class="relative">
                  <button
                    type="button"
                    class="relative p-1.5 rounded-lg transition-colors"
                    :class="shellTradicional ? 'hover:bg-white/5' : 'hover:bg-slate-100'"
                    aria-label="Central de notificações"
                    aria-haspopup="menu"
                    :aria-expanded="notificacoesAberto"
                    @click="alternarNotificacoes"
                  >
                    <Bell class="h-4 w-4" aria-hidden="true" />
                    <span
                      v-if="notificacoes.length > 0"
                      class="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"
                      aria-hidden="true"
                    ></span>
                  </button>

                  <div
                    v-if="notificacoesAberto"
                    role="menu"
                    aria-label="Notificações"
                    class="absolute right-0 top-full mt-1 w-72 rounded-lg shadow-lg z-20 overflow-hidden"
                    :class="shellTradicional ? 'bg-brand-primary border border-slate-700' : 'bg-white border border-slate-200'"
                  >
                    <div
                      class="px-3 py-2 bg-brand-primary flex items-center justify-between gap-2"
                      :class="shellTradicional ? 'border-b border-slate-700' : ''"
                    >
                      <span
                        class="text-xs font-medium"
                        :class="shellTradicional ? 'text-[#f8fafc]' : 'text-white'"
                      >Central de Notificações</span>
                      <span
                        class="text-[10px] tabular-nums"
                        :class="shellTradicional ? 'text-slate-400' : 'text-slate-300'"
                      >
                        {{ notificacoes.length }} {{ notificacoes.length === 1 ? 'nova' : 'novas' }}
                      </span>
                    </div>

                    <div
                      class="max-h-64 overflow-y-auto scrollbar-discreta"
                      :class="shellTradicional ? '' : 'bg-[#f9feee]'"
                    >
                      <template v-if="notificacoes.length > 0">
                        <button
                          v-for="notificacao in notificacoes"
                          :key="notificacao.id"
                          type="button"
                          role="menuitem"
                          class="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
                          :class="shellTradicional ? 'hover:bg-brand-structure/60' : 'hover:bg-slate-100'"
                          @click="visualizarNotificacao(notificacao.id)"
                        >
                          <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" aria-hidden="true"></span>
                          <span class="min-w-0">
                            <span
                              class="block text-xs font-medium"
                              :class="shellTradicional ? 'text-[#f8fafc]' : 'text-slate-900'"
                            >{{ notificacao.titulo }}</span>
                            <span
                              class="block text-[11px] font-light leading-snug mt-0.5"
                              :class="shellTradicional ? 'text-slate-300' : 'text-slate-600'"
                            >{{ notificacao.mensagem }}</span>
                            <span class="block text-[10px] font-light text-slate-500 mt-1">{{ notificacao.tempo }}</span>
                          </span>
                        </button>
                      </template>
                      <p
                        v-else
                        class="px-3 py-7 text-center text-xs font-light"
                        :class="shellTradicional ? 'text-slate-400' : 'text-slate-500'"
                      >Nenhuma notificação nova.</p>
                    </div>

                    <div
                      class="px-2 py-1.5 flex justify-end"
                      :class="shellTradicional ? 'border-t border-slate-700' : 'border-t border-slate-200'"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-light transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        :class="shellTradicional ? 'text-[#f8fafc] hover:bg-brand-structure/60' : 'text-[#0f7a06] hover:bg-slate-100'"
                        :disabled="notificacoes.length === 0"
                        @click="limparNotificacoes"
                      >
                        <Trash2 class="h-3 w-3" aria-hidden="true" />
                        Limpar tudo
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Bloco Account -->
                <div ref="accountRef" class="relative">
                  <button
                    type="button"
                    :class="[
                      'flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg transition-colors',
                      shellTradicional ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                    ]"
                    aria-haspopup="menu"
                    :aria-expanded="accountMenuAberto"
                    @click="alternarMenuAccount"
                  >
                    <span class="h-7 w-7 rounded-full overflow-hidden bg-brand-structure flex items-center justify-center shrink-0">
                      <img
                        v-if="avatarFoto"
                        :src="avatarFoto"
                        alt=""
                        class="h-full w-full object-cover"
                      />
                      <span v-else class="text-[10px] font-bold text-slate-950">AR</span>
                    </span>
                    <span class="text-left">
                      <span class="block text-xs font-normal leading-tight">{{ conta.nome }}</span>
                      <span class="block text-[10px] font-normal leading-tight">{{ conta.perfil }}</span>
                    </span>
                    <ChevronDownIcon
                      class="h-3.5 w-3.5 transition-transform duration-200"
                      :class="accountMenuAberto ? 'rotate-180' : 'rotate-0'"
                      aria-hidden="true"
                    />
                  </button>

                  <!-- Menu suspenso do Account -->
                  <div
                    v-if="accountMenuAberto"
                    role="menu"
                    aria-label="Menu da conta"
                    class="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg py-1 z-20"
                    :class="
                      shellTradicional
                        ? 'bg-brand-primary border border-slate-700'
                        : 'bg-white border border-slate-200'
                    "
                  >
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light transition-colors text-left"
                      :class="
                        shellTradicional
                          ? 'text-[#f8fafc] hover:bg-brand-structure/60'
                          : 'text-slate-700 hover:bg-slate-100'
                      "
                      @click="fecharMenuAccount"
                    >
                      <component
                        :is="accountMeuPerfil.icon"
                        class="h-3.5 w-3.5 shrink-0 ds-icon-light"
                        aria-hidden="true"
                      />
                      {{ accountMeuPerfil.label }}
                    </button>

                    <div
                      class="my-1 h-px"
                      :class="shellTradicional ? 'bg-white/40' : 'bg-slate-200'"
                      role="separator"
                    ></div>

                    <button
                      v-for="item in accountMenuItens"
                      :key="item.label"
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light ds-item-hover-dark transition-colors text-left"
                      :class="
                        shellTradicional
                          ? 'text-[#f8fafc] hover:bg-brand-structure/60'
                          : 'text-slate-700 hover:bg-slate-100'
                      "
                      :style="item.cor ? { '--item-cor': item.cor } : undefined"
                      @click="fecharMenuAccount"
                    >
                      <component
                        :is="item.icon"
                        class="h-3.5 w-3.5 shrink-0 ds-icon-light"
                        :style="item.cor ? { color: item.cor } : undefined"
                        aria-hidden="true"
                      />
                      {{ item.label }}
                    </button>

                    <div
                      class="my-1 h-px"
                      :class="shellTradicional ? 'bg-white/40' : 'bg-slate-200'"
                      role="separator"
                    ></div>

                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light transition-colors text-left"
                      :class="shellTradicional ? 'hover:bg-brand-structure/60' : 'hover:bg-slate-100'"
                      @click="fecharMenuAccount"
                    >
                      <component
                        :is="accountEncerrarSessao.icon"
                        class="h-3.5 w-3.5 shrink-0 ds-icon-light"
                        :style="{ color: accountEncerrarSessao.cor }"
                        aria-hidden="true"
                      />
                      <span :style="{ color: accountEncerrarSessao.cor }">
                        {{ accountEncerrarSessao.label }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Body: Sidebar + Conteúdo -->
            <div class="flex min-h-[200px]">

              <!-- Sidebar Retrátil -->
              <div
                :class="[
                  'flex flex-col transition-all duration-200 shrink-0',
                  shellTradicional
                    ? 'bg-white border-r border-slate-200'
                    : 'bg-brand-primary border-r border-white/10',
                  // No rail o overflow fica visível para o UiTooltip não ser cortado
                  sidebarOpen ? 'w-52 overflow-hidden' : 'w-[46px] overflow-visible'
                ]"
              >
                <div class="flex flex-col gap-0.5 p-2 flex-1">
                  <!-- Item raiz: acima das sessões, como no shell real -->
                  <UiTooltip :content="itemRaiz.label" position="right" :disabled="sidebarOpen" class="w-full">
                    <button
                      type="button"
                      :aria-label="itemRaiz.label"
                      :aria-current="sidebarActiveItem === itemRaiz.id ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full transition-colors',
                        sidebarOpen ? '' : 'justify-center',
                        sidebarActiveItem === itemRaiz.id
                          ? (shellTradicional ? 'bg-brand-structure/10 text-lime-700' : 'bg-white/10 text-lime-300')
                          : shellTradicional
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                      ]"
                      @click="sidebarActiveItem = itemRaiz.id"
                    >
                      <component :is="itemRaiz.icon" class="h-4 w-4 shrink-0 ds-icon-light" aria-hidden="true" />
                      <span v-if="sidebarOpen" class="text-xs font-normal truncate">{{ itemRaiz.label }}</span>
                    </button>
                  </UiTooltip>

                  <template v-for="grupo in sessoesVisiveis" :key="grupo.label">
                    <!-- Divisor entre sessões no modo rail -->
                    <div
                      v-if="!sidebarOpen"
                      :class="['h-px mx-1 my-1.5', shellTradicional ? 'bg-slate-200' : 'bg-white/15']"
                      aria-hidden="true"
                    ></div>

                    <!-- Cabeçalho da sessão (só quando expandido) -->
                    <button
                      v-if="sidebarOpen"
                      type="button"
                      class="flex items-center justify-between w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1 select-none transition-colors"
                      :class="shellTradicional ? 'hover:text-slate-600' : 'hover:text-white'"
                      :aria-expanded="grupo.aberto"
                      :aria-label="`Sessão ${grupo.label}`"
                      @click="toggleSessao(grupo)"
                    >
                      <span>{{ grupo.label }}</span>
                      <ChevronDownIcon
                        class="h-3 w-3 transition-transform duration-200"
                        :class="grupo.aberto ? 'rotate-180' : 'rotate-0'"
                        aria-hidden="true"
                      />
                    </button>

                    <!-- Itens da sessão (no rail sempre; no expandido só quando aberta) -->
                    <template v-if="grupo.aberto || !sidebarOpen">
                      <UiTooltip
                        v-for="item in grupo.items"
                        :key="item.id"
                        :content="item.label"
                        position="right"
                        :disabled="sidebarOpen"
                        class="w-full"
                      >
                        <button
                          type="button"
                          :aria-label="item.label"
                          :class="[
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full text-left transition-colors',
                            sidebarActiveItem === item.id
                              ? (shellTradicional ? 'bg-brand-structure/10 text-lime-700' : 'bg-white/10 text-lime-300')
                              : shellTradicional
                                ? 'text-slate-600 hover:bg-slate-100 ds-item-hover'
                                : 'text-slate-300 hover:bg-white/10 ds-item-hover'
                          ]"
                          :style="item.cor ? { '--item-cor': shellTradicional ? item.cor : tinta(item.cor) } : undefined"
                          @click="sidebarActiveItem = item.id"
                        >
                          <component
                            :is="item.icon"
                            class="h-4 w-4 shrink-0 ds-icon-light"
                            :style="item.cor ? { color: shellTradicional ? item.cor : tinta(item.cor) } : undefined"
                            aria-hidden="true"
                          />
                          <span v-if="sidebarOpen" class="text-xs font-normal truncate">{{ item.label }}</span>
                        </button>
                      </UiTooltip>
                    </template>
                  </template>
                </div>
              </div>

              <!-- Área de Conteúdo -->
              <div class="flex-1 flex items-center justify-center text-center p-6" style="background-color:#f8fafc;">
                <div>
                  <p class="text-sm font-semibold text-slate-700">Área de Conteúdo (App Canvas)</p>
                  <p class="text-xs text-slate-400 mt-1">Espaço expansivo com foco em tabelas, KPIs e formulários</p>
                  <div class="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-[11px] font-medium"
                      @click="sidebarOpen = !sidebarOpen"
                    >
                      {{ sidebarOpen ? 'Recolher Sidebar' : 'Expandir Sidebar' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rodapé: Impressão -->
          <div class="mt-4 flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
            <span class="text-slate-600">Teste o comportamento da folha de estilos de impressão sem cabeçalhos e barras:</span>
            <UiButton variant="primary" size="sm" @click="handlePrint">
              <template #leftIcon><Printer class="h-3.5 w-3.5" /></template>
              Disparar @media print
            </UiButton>
          </div>
        </section>

        <!-- 15. Modal de Cadastro -->
        <section id="modal" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <FormInput class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  15. Modal de Cadastro (UiModal + UiModalSection)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Diálogo portal com header <code class="font-mono text-slate-700">[#112051]</code> e
                  acento verde, sessões de campos em cards brancos sobre corpo cinza e footer com
                  botões do sistema. O backdrop não fecha; <code class="font-mono text-slate-700">Escape</code>,
                  o <code class="font-mono text-slate-700">X</code> e as ações do footer fecham.
                  Inclui a demo do <strong>modal de confirmação destrutiva</strong> (rodapé com a
                  variante <code class="font-mono text-slate-700">danger</code>).
                </p>
              </div>
            </div>
          </div>

          <!-- Gatilho da Demo -->
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <UiButton variant="primary" @click="modalDemoAberto = true">
              <template #leftIcon><FormInput class="h-3.5 w-3.5" /></template>
              Abrir Modal de Cadastro
            </UiButton>
            <UiButton variant="danger" @click="modalConfirmacaoAberto = true">
              <template #leftIcon><Trash2 class="h-3.5 w-3.5" /></template>
              Abrir Modal de Confirmação
            </UiButton>
            <span class="text-xs text-slate-500">
              Tamanhos disponíveis: <code class="font-mono text-slate-700">sm (480px)</code>,
              <code class="font-mono text-slate-700">md (640px, padrão)</code>,
              <code class="font-mono text-slate-700">lg (880px)</code>
            </span>
          </div>

          <!-- Modal de Demonstração -->
          <UiModal
            v-model="modalDemoAberto"
            title="Nova Publicação"
            subtitle="Dados do conteúdo, contato editorial e periodicidade"
            :icon="Building2"
            size="md"
            @close="fecharModalDemo"
          >
            <div class="grid gap-4">
              <UiModalSection title="Dados da Publicação" :icon="Building2">
                <div class="grid gap-4 sm:grid-cols-2">
                  <UiInput v-model="modalDemoTitulo" label="Título" placeholder="Título completo do conteúdo" />
                  <UiInput v-model="modalDemoSlug" label="Slug" mono placeholder="slug-da-publicacao" />
                  <UiDatePicker
                    v-model="modalDemoData"
                    label="Data de Publicação"
                    placeholder="DD/MM/AAAA"
                  />
                </div>
              </UiModalSection>

              <UiModalSection title="Contato" :icon="Mail">
                <div class="grid gap-4 sm:grid-cols-2">
                  <UiInput v-model="modalDemoEmail" label="E-mail Editorial" type="email" placeholder="conteudo@dicasteorema.com.br" />
                  <UiSelect
                    v-model="modalDemoPeriodicidade"
                    label="Periodicidade"
                    :options="modalDemoPeriodicidadeOpcoes"
                    :left-icon="ListFilter"
                  />
                </div>
              </UiModalSection>
            </div>

            <!-- Empilhamento de modais (docs/01 §5.12) -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <span class="text-xs text-slate-500">
                Modal filho: <code class="font-mono text-slate-700">Escape</code> e
                <code class="font-mono text-slate-700">Tab</code> chegam somente ao topo da pilha.
              </span>
              <UiButton variant="outline" size="sm" @click="modalFilhoAberto = true">
                <template #leftIcon><Layers class="h-3.5 w-3.5" /></template>
                Abrir modal filho
              </UiButton>
            </div>

            <UiModal
              v-model="modalFilhoAberto"
              title="Modal filho"
              subtitle="Empilhado sobre o modal de cadastro"
              :icon="Layers"
              size="xs"
            >
              <UiModalSection title="Conteúdo do filho" :icon="Layers">
                <UiInput v-model="modalFilhoCampo" label="Campo do filho" />
                <p class="text-[11px] text-slate-500">
                  Ao fechar este modal, o foco volta ao botão acima e o modal pai permanece aberto.
                </p>
              </UiModalSection>
              <template #footer>
                <UiButton variant="outline" @click="modalFilhoAberto = false">Fechar filho</UiButton>
              </template>
            </UiModal>

            <template #footer>
              <UiButton variant="outline" @click="fecharModalDemo">Cancelar</UiButton>
              <UiButton variant="primary" @click="salvarModalDemo">
                <template #leftIcon><Save class="h-3.5 w-3.5" /></template>
                Salvar
              </UiButton>
            </template>
          </UiModal>

          <!-- Modal de confirmação destrutiva (mesmo padrão do modal de exclusão de usuário) -->
          <UiModal
            v-model="modalConfirmacaoAberto"
            title="Excluir Registro"
            subtitle="Confirmação destrutiva"
            :icon="Trash2"
            size="sm"
          >
            <UiModalSection title="Este registro será excluído" :icon="AlertTriangle">
              <p class="text-sm font-medium text-slate-900 font-mono break-all">
                release-week-2026-w40
              </p>
              <p class="flex items-start gap-2 text-xs text-rose-700">
                <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
                <span>
                  Esta ação não pode ser desfeita: o registro sai da base em memória e
                  só volta na recarga da página.
                </span>
              </p>
            </UiModalSection>
            <template #footer>
              <UiButton variant="outline" size="md" @click="modalConfirmacaoAberto = false">
                Cancelar
              </UiButton>
              <UiButton variant="danger" size="md" @click="confirmarDemoExclusao">
                <template #leftIcon><Trash2 class="h-3.5 w-3.5" /></template>
                Excluir
              </UiButton>
            </template>
          </UiModal>
        </section>

        <!-- 16. Tabs & Slider -->
        <section id="tabs-slider" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <Layers class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  16. Tabs & Slider (UiTabs + UiSlider)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Navegação por abas com pill ativa lime
                  <code class="font-mono text-slate-700">bg-lime-50 border-lime-300</code>,
                  teclado (<code class="font-mono text-slate-700">←/→/Home/End</code>) e ARIA
                  <code class="font-mono text-slate-700">tablist/tab/tabpanel</code>; slider numérico com
                  track preenchida em degradê navy → azul → verde e legenda opcional de marcas.
                </p>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-3">UiTabs</p>
            <UiTabs v-model="tabsDemoAba" id-prefix="demo" :items="tabsDemoAbas" aria-label="Abas de demonstração" />
            <div
              :id="`demo-panel-${tabsDemoAba}`"
              role="tabpanel"
              :aria-labelledby="`demo-tab-${tabsDemoAba}`"
              class="mt-4 p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
            >
              <template v-if="tabsDemoAba === 'design'">Conteúdo da aba <strong>Design Tokens</strong> — cores, tipografia e espaçamento.</template>
              <template v-else-if="tabsDemoAba === 'acessibilidade'">Conteúdo da aba <strong>Acessibilidade</strong> — contraste, foco e ARIA.</template>
              <template v-else-if="tabsDemoAba === 'conteudo'">Conteúdo da aba <strong>Conteúdo</strong> — publicações e manuais.</template>
              <template v-else>Conteúdo da aba <strong>Segurança</strong> — auditoria e rate limits.</template>
            </div>
          </div>

          <!-- Slider -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">UiSlider</p>
              <span class="font-mono tabular-nums text-sm font-medium text-brand-primary">{{ sliderDemoDias }} dias</span>
            </div>
            <UiSlider
              v-model="sliderDemoDias"
              aria-label="Janela de retenção de demonstração"
              :marks="sliderDemoMarks"
            />
          </div>
        </section>

        <!-- 17. Cards de Escolha -->
        <section id="choice-card" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <LayoutGrid class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  17. Cards de Escolha (UiChoiceCard)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Escolha única com semântica
                  <code class="font-mono text-slate-700">radiogroup/radio</code>, um único ponto de
                  Tab, setas/Home/End movendo foco e seleção, tom por cartão
                  (<code class="font-mono text-slate-700">sky</code>/<code class="font-mono text-slate-700">emerald</code>),
                  recorte de foco <code class="font-mono text-slate-700">brand-focus</code> e cartão
                  desabilitado com dica.
                </p>
              </div>
            </div>
          </div>

          <!-- Grupo vazio + desabilitado -->
          <div class="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Sem seleção inicial — neutro e desabilitado com dica
              </p>
              <span class="font-mono text-xs text-slate-500">valor: {{ choiceCardVazio || '(vazio)' }}</span>
            </div>
            <div role="radiogroup" aria-label="Canal de envio — demonstração sem seleção" class="grid sm:grid-cols-3 gap-3">
              <UiChoiceCard
                v-for="op in choiceCardCanaisComSms"
                :key="op.value"
                v-model="choiceCardVazio"
                v-bind="op"
              />
            </div>
          </div>

          <!-- Grupo com tom sky selecionado -->
          <div class="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Seleção inicial no tom sky (E-mail)
              </p>
              <span class="font-mono text-xs text-slate-500">valor: {{ choiceCardSky }}</span>
            </div>
            <div role="radiogroup" aria-label="Canal de envio — demonstração tom sky" class="grid sm:grid-cols-2 gap-3">
              <UiChoiceCard
                v-for="op in choiceCardCanais"
                :key="op.value"
                v-model="choiceCardSky"
                v-bind="op"
              />
            </div>
          </div>

          <!-- Grupo com tom emerald selecionado -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Seleção inicial no tom emerald (WhatsApp)
              </p>
              <span class="font-mono text-xs text-slate-500">valor: {{ choiceCardEmerald }}</span>
            </div>
            <div role="radiogroup" aria-label="Canal de envio — demonstração tom emerald" class="grid sm:grid-cols-2 gap-3">
              <UiChoiceCard
                v-for="op in choiceCardCanais"
                :key="op.value"
                v-model="choiceCardEmerald"
                v-bind="op"
              />
            </div>
          </div>
        </section>

        <!-- 18. Loading -->
        <section id="loading" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <LoaderCircle class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  18. Loading (UiLoading)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Overlay com backdrop <code class="font-mono text-slate-700">bg-zinc-900/50</code>,
                  caixa com borda em degradê cônico giratório (Navy
                  <code class="font-mono text-slate-700">#112051</code> → Estrutural
                  <code class="font-mono text-slate-700">#0364f7</code> → Accent
                  <code class="font-mono text-slate-700">#4ed813</code>), ícone
                  <code class="font-mono text-slate-700">LoaderCircle</code> girando à esquerda
                  (<code class="font-mono text-slate-700">h-5</code>/<code class="font-mono text-slate-700">h-6</code>/<code class="font-mono text-slate-700">h-8</code>
                  em sm/md/lg) e mensagem viva <code class="font-mono text-slate-700">role="status"</code>;
                  com <code class="font-mono text-slate-700">current</code>/<code class="font-mono text-slate-700">total</code>
                  exibe barra de progresso com degradê da marca e contador pt-BR
                  (<code class="font-mono text-slate-700">role="progressbar"</code>); camada
                  <code class="font-mono text-slate-700">z-[70]</code> acima dos modais, sem
                  fechamento pelo usuário, rolagem travada e movimento reduzido respeitado.
                </p>
              </div>
            </div>
          </div>

          <!-- Demonstração do overlay (abre e fecha sozinha) -->
          <div class="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Demonstração — abre o overlay e fecha sozinho em ~3,5 s
              </p>
              <span class="font-mono text-xs text-slate-500"
                >v-if: {{ loadingDemo }} · progresso: {{ loadingDemoComProgresso }}</span
              >
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UiButton variant="primary" @click="abrirLoadingDemo(false)">
                Abrir loading
              </UiButton>
              <UiButton variant="outline" @click="abrirLoadingDemo(true)">
                Abrir com progresso
              </UiButton>
              <span class="text-xs text-slate-500">
                Enquanto aberto: clique bloqueado, rolagem travada,
                <code class="font-mono">Escape</code> não fecha.
              </span>
            </div>
          </div>

          <!-- Uso -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">Uso</p>
            <pre class="text-xs font-mono text-slate-700 whitespace-pre-wrap">&lt;UiLoading v-if="salvando" message="Importando 1.240 registros de usuários…" /&gt;
&lt;UiLoading v-if="importando" message="Importando registros…" :current="1240" :total="5000" /&gt;</pre>
          </div>
        </section>

        <!-- 19. Textarea -->
        <section id="textarea" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs scroll-mt-24">
          <!-- Header da Seção -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-start gap-2.5">
              <div class="p-1.5 rounded-lg bg-brand-primary text-brand-accent shrink-0 mt-0.5">
                <AlignLeft class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900 tracking-tight">
                  19. Textarea (UiTextarea)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Campo multilinha do kit — mesmo DNA do
                  <code class="font-mono text-slate-700">UiInput</code>: foco recortado na
                  borda inferior em
                  <code class="font-mono text-slate-700">brand-focus</code>
                  <code class="font-mono text-slate-700">#1a9e07</code>, erro em
                  <code class="font-mono text-slate-700">rose-700</code> com ícone+tooltip e
                  mensagem <code class="font-mono text-slate-700">sr-only</code>
                  <code class="font-mono text-slate-700">role="alert"</code> via
                  <code class="font-mono text-slate-700">aria-describedby</code>; altura pelo
                  <code class="font-mono text-slate-700">rows</code> (padrão 3) com
                  <code class="font-mono text-slate-700">resize-y</code>, Enter quebra linha e
                  Tab sai do campo.
                </p>
              </div>
            </div>
          </div>

          <!-- Demonstração -->
          <div class="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div class="grid gap-4 md:grid-cols-2">
              <UiTextarea
                v-model="textareaDemo"
                label="Descrição"
                placeholder="Detalhe as responsabilidades do perfil…"
              />
              <UiTextarea
                label="Descrição"
                :model-value="'Campo fixado em erro para conferir o recorte rose-700.'"
                :error="textareaErroDemo"
                disabled
              />
            </div>
            <p class="mt-3 text-xs text-slate-500">
              Valor da demo (v-model):
              <span class="font-mono text-slate-700">{{ textareaDemo || '—' }}</span>
              · o exemplo da direita está desabilitado e em erro (ícone, borda e
              mensagem acessível no DOM).
            </p>
          </div>

          <!-- Uso -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">Uso</p>
            <pre class="text-xs font-mono text-slate-700 whitespace-pre-wrap">&lt;UiTextarea v-model="descricao" label="Descrição" placeholder="Detalhe as responsabilidades…" :rows="4" /&gt;
&lt;UiTextarea label="Descrição" :model-value="'…'" error="Informe a descrição." /&gt;</pre>
          </div>
        </section>
      </main>
    </div>

    <!-- Modal da Câmera Web (aberto pelo ícone de foto do UploadFiles) -->
    <UiCameraWeb
      v-if="cameraAberta"
      @foto="aoFotoCapturada"
      @fechar="cameraAberta = false"
    />

    <!-- Demo do UiLoading (Seção 18) — desmonta pelo timer de encerrarLoadingDemo -->
    <UiLoading
      v-if="loadingDemo"
      :message="
        loadingDemoComProgresso
          ? 'Importando registros de usuários…'
          : 'Importando 1.240 registros de usuários…'
      "
      :current="loadingDemoComProgresso ? loadingProgressCurrent : undefined"
      :total="loadingDemoComProgresso ? LOADING_TOTAL : undefined"
    />
  </div>
</template>

<style scoped>
.scrollbar-discreta {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}

.scrollbar-discreta::-webkit-scrollbar {
  width: 5px;
}

.scrollbar-discreta::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-discreta::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 999px;
}

.scrollbar-discreta::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
