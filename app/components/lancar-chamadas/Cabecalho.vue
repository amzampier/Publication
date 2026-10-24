<script setup lang="ts">
import { ref } from 'vue'
import {
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  Megaphone,
  Plus
} from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useApiFetch } from '../../composables/useApiFetch'
import { useToast } from '../../composables/useToast'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import { gerarPdfLancarChamadas } from './gerarPdfLancarChamadas'

const emit = defineEmits<{
  (e: 'novo'): void
}>()

const { can } = usePermissions()
const { total, exportarLinhas, urlExportacaoCsv } = useLancarChamadasModelo()
const { toast } = useToast()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportando = ref(false)

const semDados = (): boolean => {
  if (total.value > 0) return false
  toast.info('Exportação', 'Não há chamadas para exportar com os filtros atuais.')
  return true
}



const exportarCsv = () => {
  if (semDados()) return
  window.location.assign(urlExportacaoCsv())
}
const gerarPdf = async () => {
  if (semDados()) return
  exportando.value = true
  try {
    const dados = await exportarLinhas()
    if (!dados.length) {
      toast.info('Exportação', 'Não há chamadas para exportar com os filtros atuais.')
      return
    }
    await gerarPdfLancarChamadas({
      chamadas: dados,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatório de chamadas:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a listagem em PDF. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const acoesRelatorio: Record<string, () => void> = {
  pdf: gerarPdf,
  csv: exportarCsv
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
        <Megaphone class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Lançar as Chamadas</h1>
        <p class="mt-1 text-xs text-slate-500">
          Lançamento e manutenção das chamadas — vínculos, classificação, conteúdo e aprovação.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('lancar-chamadas', 'download')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('lancar-chamadas', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Nova Chamada
      </UiButton>
    </div>
  </header>
</template>
