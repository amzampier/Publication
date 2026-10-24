<script setup lang="ts">
import { ref } from 'vue'
// Cabeçalho da tela de Escopo de Projetos: tile, menu "Relatórios" (PDF/CSV
// sobre o conjunto vigente da API) e ação primária "Novo Escopo". As
// exportações validam a permissão no servidor antes de gerar o arquivo.
import {
  ClipboardList,
  Plus,
  FileDown,
  FileSpreadsheet,
} from '@lucide/vue'
import { useEscopoProjetosModelo } from './useEscopoProjetosModelo'
import { gerarPdfEscopoProjetos } from './gerarPdfEscopoProjetos'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import { useApiFetch } from '../../composables/useApiFetch'
import { formatarNumero, formatarPeriodo, softwaresTexto } from './validadores'

const emit = defineEmits<{
  (e: 'novo'): void
}>()

const { can } = usePermissions()
const { escoposVisiveis } = useEscopoProjetosModelo()
const { toast } = useToast()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportando = ref(false)

const semDados = (): boolean => {
  if (escoposVisiveis.value.length > 0) return false
  toast.info('Exportação', 'Não há Escopos de Projetos para exportar com os filtros atuais.')
  return true
}

const validarExportacao = async (): Promise<boolean> => {
  try {
    await useApiFetch('/api/escopo-projetos', { query: { exportar: '1' } })
    return true
  } catch {
    toast.danger('Exportação', 'Você não tem permissão para exportar Escopos de Projetos.')
    return false
  }
}

const escapar = (v: string | number) => {
  let texto = String(v)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

const exportarCsv = async () => {
  if (semDados()) return
  if (!(await validarExportacao())) return
  const cabecalho = [
    'Código',
    'Nome',
    'Versão',
    'Ano',
    'Status',
    'Período',
    'Softwares',
    'Visualizações'
  ]
  const linhasCsv = escoposVisiveis.value.map((escopo) =>
    [
      escopo.codigo,
      escopo.nome,
      escopo.versao,
      escopo.ano,
      escopo.status,
      formatarPeriodo(escopo.dataInicio, escopo.dataFinal),
      softwaresTexto(escopo.softwaresContemplados),
      formatarNumero(escopo.totalVisualizacoes)
    ]
      .map(escapar)
      .join(';')
  )
  const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhasCsv].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'escopo-projetos.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const relacaoPdf = async () => {
  if (semDados()) return
  if (!(await validarExportacao())) return
  exportando.value = true
  try {
    await gerarPdfEscopoProjetos({
      escopos: escoposVisiveis.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de escopo de projetos:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a listagem em PDF. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const acoesRelatorio: Record<string, () => void> = {
  pdf: relacaoPdf,
  csv: exportarCsv
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#50a1ff]">
        <ClipboardList class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Escopo de Projetos</h1>
        <p class="mt-1 text-xs text-slate-500">
          Catálogo de escopos anuais — versão, período, softwares e situação.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('escopo-projetos', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('escopo-projetos', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Escopo
      </UiButton>
    </div>
  </header>
</template>
