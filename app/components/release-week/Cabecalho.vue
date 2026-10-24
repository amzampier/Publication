<script setup lang="ts">
import { ref } from 'vue'
// Cabeçalho da tela de Release Week: tile, menu "Relatórios" (PDF/CSV sobre o
// conjunto vigente) e ação primária "Nova Release Week". Sem backend nesta
// fase: as exportações leem o dataset em memória (nenhuma requisição).
import { Rocket, Plus, FileDown, FileSpreadsheet } from '@lucide/vue'
import { useReleaseWeekModelo } from './useReleaseWeekModelo'
import { gerarPdfReleaseWeek } from './gerarPdfReleaseWeek'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import { useApiFetch } from '../../composables/useApiFetch'

const emit = defineEmits<{
  (e: 'novo'): void
}>()

const { can } = usePermissions()
const { linhas } = useReleaseWeekModelo()
const { toast } = useToast()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportando = ref(false)

const semDados = (): boolean => {
  if (linhas.value.length > 0) return false
  toast.info('Exportação', 'Não há Release Weeks para exportar com os filtros atuais.')
  return true
}

const exportarCsv = async () => {
  if (semDados()) return
  try {
    // Guarda server-side: exige release-week/exportar antes de gerar o arquivo.
    await useApiFetch('/api/release-week', { query: { exportar: '1' } })
    const escapar = (v: string | number) => {
      let texto = String(v)
      if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
      return `"${texto.replace(/"/g, '""')}"`
    }
    const cabecalho = [
      'Código',
      'Nome',
      'Semana/Ano',
      'Período',
      'Status',
      'Autor',
      'Data de publicação'
    ]
    const linhasCsv = linhas.value.map((linha) =>
      [
        linha.codigo,
        linha.nome,
        linha.semanaAno,
        linha.periodo,
        linha.status,
        linha.autor,
        linha.dataPublicacao
      ]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhasCsv].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'release-week.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar release week:', erro)
    toast.danger('Exportação', 'Não foi possível exportar as Release Weeks. Tente novamente.')
  }
}

const relacaoPdf = async () => {
  if (semDados()) return
  exportando.value = true
  try {
    // Guarda server-side: exige release-week/exportar antes de gerar o arquivo.
    await useApiFetch('/api/release-week', { query: { exportar: '1' } })
    await gerarPdfReleaseWeek({
      releases: linhas.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de release week:', erro)
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
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#1a9e07]">
        <Rocket class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Release Week</h1>
        <p class="mt-1 text-xs text-slate-500">
          Cabeçalho das semanas de entrega — período, status, autor e itens de cada release.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('release-week', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('release-week', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Nova Release Week
      </UiButton>
    </div>
  </header>
</template>
