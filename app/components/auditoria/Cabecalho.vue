<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ScrollText, Download, FileSpreadsheet, ChevronDown, DownloadIcon } from '@lucide/vue'
import { useAuditoriaModelo, formatarDataHora } from './useAuditoriaModelo'
import { gerarPdfAuditoria } from './gerarPdfAuditoria'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'

const { can } = usePermissions()

// Menu "Exportar" (mini-menu role=menu — padrão do menu da conta do AppHeader)
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

// Exportação sobre o conjunto filtrado COMPLETO (buscado pela API, pois a
// listagem é paginada — change paginacao-server-side-e-performance)
const { filtros, periodoRotulo, buscarParaExportacao } = useAuditoriaModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = async () => {
  menuAberto.value = false
  exportando.value = true
  try {
    const registros = await buscarParaExportacao()
    // RL05-B-01: neutraliza fórmula em CSV (Excel/LibreOffice) antes de citar.
    const escapar = (v: string | number) => {
      let texto = String(v)
      if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
      return `"${texto.replace(/"/g, '""')}"`
    }
    const cabecalho = ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes', 'IP']
    const linhas = registros.map((r) =>
      [formatarDataHora(r.registradoEm), r.usuario.nome, r.acao, r.recurso, r.detalhes, r.ip]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhas].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'auditoria.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar auditoria:', erro)
    toast.danger('Exportação', 'Não foi possível exportar a auditoria. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const baixarPdf = async () => {
  menuAberto.value = false
  exportando.value = true
  try {
    const registros = await buscarParaExportacao()
    await gerarPdfAuditoria({
      registros,
      filtros: filtros.value,
      periodoRotulo: periodoRotulo.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio:', erro)
    toast.danger('Exportação', 'Não foi possível gerar o PDF da auditoria. Tente novamente.')
  } finally {
    exportando.value = false
  }
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#2dd4bf]">
        <ScrollText class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Gestão de Auditoria
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Registro das operações do sistema — ações, usuários, recursos e rastreabilidade.
        </p>
      </div>
    </div>

    <div v-if="can('auditoria', 'exportar')" ref="exportarRef" class="relative shrink-0 w-full sm:w-auto">
      <UiButton
        variant="outline"
        size="md"
        class="w-full sm:w-auto"
        :loading="exportando"
        aria-haspopup="menu"
        :aria-expanded="menuAberto"
        @click="menuAberto = !menuAberto"
      >
        <template #leftIcon><Download class="h-4 w-4" /></template>
        Exportar
        <ChevronDown
          class="h-3.5 w-3.5 transition-transform"
          :class="menuAberto ? 'rotate-180' : 'rotate-0'"
          aria-hidden="true"
        />
      </UiButton>

      <div
        v-if="menuAberto"
        role="menu"
        aria-label="Opções de exportação"
        class="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30"
      >
        <button
          type="button"
          role="menuitem"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
          @click="exportarCsv"
        >
          <FileSpreadsheet class="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
          Exportar em CSV
        </button>
        <div class="my-1 h-px bg-slate-200" role="separator"></div>
        <button
          type="button"
          role="menuitem"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
          @click="baixarPdf"
        >
          <DownloadIcon class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
          Download em PDF
        </button>
      </div>
    </div>
  </header>
</template>