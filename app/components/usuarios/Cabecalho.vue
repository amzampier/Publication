<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Users, Plus, NotebookText, FileText, FileDown, FileSpreadsheet, ChevronDown } from '@lucide/vue'
import { useUsuariosDemo, formatarUltimoAcesso } from './useUsuariosDemo'
import { gerarPdfUsuarios } from './gerarPdfUsuarios'
import { gerarPdfFichaCadastral } from './gerarPdfFichaCadastral'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'

const { toast } = useToast()

// Fase 1: cadastro/edição vêm com os modais na próxima etapa (spec gestao-usuarios)
const novoUsuario = () => {
  toast.info(
    'Gestão de Usuários',
    'Cadastro de usuário: funcionalidade disponível na próxima etapa.'
  )
}

// Menu "Relatórios" (mini-menu role=menu — padrão do menu da conta do AppHeader)
const menuAberto = ref(false)
const exportarRef = ref<HTMLElement | null>(null)

const aoClicarFora = (e: MouseEvent) => {
  if (exportarRef.value && !exportarRef.value.contains(e.target as Node)) menuAberto.value = false
}
const aoKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') menuAberto.value = false
}
onMounted(() => {
  document.addEventListener('click', aoClicarFora)
  window.addEventListener('keydown', aoKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', aoClicarFora)
  window.removeEventListener('keydown', aoKeydown)
})

// Exportação sobre o conjunto vigente (fase 1 — tudo em memória)
const { usuariosFiltrados } = useUsuariosDemo()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = () => {
  menuAberto.value = false
  const escapar = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const cabecalho = ['Nome', 'E-mail', 'Perfil', 'Status', 'Último acesso']
  const linhas = usuariosFiltrados.value.map((u) =>
    [u.nome, u.email, u.perfil, u.status, formatarUltimoAcesso(u.ultimoAcesso)]
      .map(escapar)
      .join(';')
  )
  const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhas].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'usuarios.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const fichaCadastralPdf = async () => {
  menuAberto.value = false
  try {
    await gerarPdfFichaCadastral({
      usuarios: usuariosFiltrados.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar a ficha cadastral:', erro)
  }
}

const relacaoCompletaPdf = async () => {
  menuAberto.value = false
  try {
    await gerarPdfUsuarios({
      usuarios: usuariosFiltrados.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio:', erro)
  }
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#b070ef]">
        <Users class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Gestão de Usuários
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Administração de usuários do sistema — perfis de acesso, status e último acesso.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <div ref="exportarRef" class="relative w-full sm:w-auto">
        <UiButton
          variant="outline"
          size="md"
          class="w-full sm:w-auto"
          aria-haspopup="menu"
          :aria-expanded="menuAberto"
          @click="menuAberto = !menuAberto"
        >
          <template #leftIcon><NotebookText class="h-4 w-4" /></template>
          Relatórios
          <ChevronDown
            class="h-3.5 w-3.5 transition-transform"
            :class="menuAberto ? 'rotate-180' : 'rotate-0'"
            aria-hidden="true"
          />
        </UiButton>

        <div
          v-if="menuAberto"
          role="menu"
          aria-label="Opções de relatórios"
          class="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30"
        >
          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
            @click="fichaCadastralPdf"
          >
            <FileText class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
            Ficha Cadastral
          </button>
          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
            @click="relacaoCompletaPdf"
          >
            <FileDown class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
            Relação Completa
          </button>
          <div class="my-1 h-px bg-slate-200" role="separator"></div>
          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
            @click="exportarCsv"
          >
            <FileSpreadsheet class="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            Exportar em CSV
          </button>
        </div>
      </div>

      <UiButton
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="novoUsuario"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Usuário
      </UiButton>
    </div>
  </header>
</template>
