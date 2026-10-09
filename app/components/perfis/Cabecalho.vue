<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ShieldCheck,
  Plus,
  NotebookText,
  FileDown,
  FileSpreadsheet,
  ChevronDown
} from '@lucide/vue'
import {
  usePerfisDemo,
  contarPermissoes,
  PERMISSOES_POR_PERFIL
} from './usePerfisDemo'
import { gerarPdfPerfis } from './gerarPdfPerfis'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'

// Abre o modal de cadastro em modo de criação (coordenação na página)
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Menu "Relatórios" (mini-menu role=menu — molde do UsuariosCabecalho)
const menuAberto = ref(false)
const relatoriosRef = ref<HTMLElement | null>(null)

const aoClicarFora = (e: MouseEvent) => {
  if (relatoriosRef.value && !relatoriosRef.value.contains(e.target as Node)) menuAberto.value = false
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

// Exportação sobre o conjunto vigente (fase 1 — tudo em memória; com filtro
// aplicado, sai apenas o conjunto filtrado — spec perfis-acesso)
const { perfisFiltrados, usuariosPorPerfil } = usePerfisDemo()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = () => {
  menuAberto.value = false
  const escapar = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const cabecalho = ['Nome', 'Descrição', 'Status', 'Usuários', 'Permissões']
  const linhas = perfisFiltrados.value.map((p) =>
    [
      p.nome,
      p.descricao,
      p.situacao,
      usuariosPorPerfil.value[p.nome] ?? 0,
      `${contarPermissoes(p)}/${PERMISSOES_POR_PERFIL}`
    ]
      .map(escapar)
      .join(';')
  )
  const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhas].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'perfis.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const relacaoPerfisPdf = async () => {
  menuAberto.value = false
  try {
    await gerarPdfPerfis({
      perfis: perfisFiltrados.value,
      usuariosPorPerfil: usuariosPorPerfil.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de perfis:', erro)
  }
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#f5b302]">
        <ShieldCheck class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Perfis de Acesso (RBAC)
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Administração dos perfis de acesso — permissões por módulo, usuários vinculados e status.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <div ref="relatoriosRef" class="relative w-full sm:w-auto">
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
            @click="relacaoPerfisPdf"
          >
            <FileDown class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
            Relação de perfis
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
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Perfil
      </UiButton>
    </div>
  </header>
</template>
