<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Boxes,
  Plus,
  NotebookText,
  FileDown,
  FileSpreadsheet,
  ChevronDown
} from '@lucide/vue'
import { useSoftwaresModelo } from './useSoftwaresModelo'
import { gerarPdfSoftwares } from './gerarPdfSoftwares'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'

// Abre o fluxo de cadastro (coordenação na página — modal ainda não existe nesta
// fase; a página informa que a ação chega com o backend).
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Menu "Relatórios" (mini-menu role=menu — molde do PerfisCabecalho/UsuariosCabecalho)
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

// Exportação sobre o conjunto vigente (filtrado) — spec softwares: sai apenas o
// conjunto filtrado; geração 100% client-side, sem requisição por arquivo.
const { linhas } = useSoftwaresModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = () => {
  menuAberto.value = false
  try {
    // RL05-B-01: neutraliza fórmula em CSV (Excel/LibreOffice) antes de citar.
    const escapar = (v: string | number) => {
      let texto = String(v)
      if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
      return `"${texto.replace(/"/g, '""')}"`
    }
    const cabecalho = ['Código', 'Descrição', 'Categoria', 'Situação', 'Criado em', 'Atualizado em']
    const linhasCsv = linhas.value.map((s) =>
      [s.codigo, s.descricao, s.categoria, s.situacao, s.criadoEm, s.atualizadoEm]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhasCsv].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'softwares.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar softwares:', erro)
    toast.danger('Exportação', 'Não foi possível exportar os softwares. Tente novamente.')
  }
}

const relacaoSoftwaresPdf = async () => {
  menuAberto.value = false
  exportando.value = true
  try {
    await gerarPdfSoftwares({
      softwares: linhas.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de softwares:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a listagem de softwares. Tente novamente.')
  } finally {
    exportando.value = false
  }
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#0364f7]">
        <Boxes class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Softwares</h1>
        <p class="mt-1 text-xs text-slate-500">
          Catálogo de softwares corporativos — categoria, situação e auditoria de cadastro.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <div ref="relatoriosRef" class="relative w-full sm:w-auto">
        <UiButton
          variant="outline"
          size="md"
          class="w-full sm:w-auto"
          :loading="exportando"
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
            @click="relacaoSoftwaresPdf"
          >
            <FileDown class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
            Listagem em PDF
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
        Novo Software
      </UiButton>
    </div>
  </header>
</template>
