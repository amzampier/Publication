<script setup lang="ts">
import { ref } from 'vue'
import { ScrollText, Download, FileSpreadsheet, DownloadIcon } from '@lucide/vue'
import { useAuditoriaModelo, formatarDataHora } from './useAuditoriaModelo'
import { gerarPdfAuditoria } from './gerarPdfAuditoria'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'

const { can } = usePermissions()

// Menu "Exportar" (mini-menu role=menu — padrão do menu da conta do AppHeader)
// Exportação sobre o conjunto filtrado COMPLETO (buscado pela API, pois a
// listagem é paginada — change paginacao-server-side-e-performance)
const { filtros, periodoRotulo, buscarParaExportacao, urlExportacaoCsv } = useAuditoriaModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = () => {
  window.location.assign(urlExportacaoCsv())
}
const baixarPdf = async () => {
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

const acoesRelatorio: Record<string, () => void> = {
  csv: exportarCsv,
  pdf: baixarPdf
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
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

    <UiReportMenu
      v-if="can('auditoria', 'exportar')"
      :items="[
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet },
          { id: 'pdf', label: 'Download em PDF', icon: Download }
      ]"
      :loading="exportando"
      label="Exportar"
      @select="(id) => acoesRelatorio[id]?.()"
    />
  </header>
</template>