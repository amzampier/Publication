<script setup lang="ts">
import { ref } from 'vue'
import { Handshake, Plus, FileDown, FileSpreadsheet } from '@lucide/vue'
import { useParceirosModelo } from './useParceirosModelo'
import { gerarPdfParceiros } from './gerarPdfParceiros'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import { useApiFetch } from '../../composables/useApiFetch'

const { can } = usePermissions()

// Abre o fluxo de cadastro (coordenação na página).
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Menu "Relatórios" (mini-menu role=menu — molde do SoftwaresCabecalho)
// Exportação sobre o conjunto vigente (filtrado + busca).
const { parceirosVisiveis } = useParceirosModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = async () => {
  try {
    // Guarda server-side: exige parceiros/exportar antes de gerar o arquivo.
    await useApiFetch('/api/parceiros', { query: { exportar: '1' } })
    const escapar = (v: string | number) => {
      let texto = String(v)
      if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
      return `"${texto.replace(/"/g, '""')}"`
    }
    const cabecalho = ['Código', 'Razão Social', 'Nome Fantasia', 'Cidade', 'Estado', 'Região', 'Situação']
    const linhasCsv = parceirosVisiveis.value.map((p) =>
      [p.codigo, p.razao_social, p.nome_fantasia, p.cidade, p.estado, p.regiao, p.situacao]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhasCsv].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'parceiros.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar parceiros:', erro)
    toast.danger('Exportação', 'Não foi possível exportar os parceiros. Tente novamente.')
  }
}

const relacaoParceirosPdf = async () => {
  exportando.value = true
  try {
    await useApiFetch('/api/parceiros', { query: { exportar: '1' } })
    await gerarPdfParceiros({ parceiros: parceirosVisiveis.value, logoPreview: previewLoginGlobal.value })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de parceiros:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a listagem de parceiros. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const acoesRelatorio: Record<string, () => void> = {
  pdf: relacaoParceirosPdf,
  csv: exportarCsv
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
        <Handshake class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Parceiros</h1>
        <p class="mt-1 text-xs text-slate-500">
          Cadastro de parceiros clientes, redes e distribuidoras — código, região e situação.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('parceiros', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton v-if="can('parceiros', 'criar')" variant="primary" size="md" class="w-full sm:w-auto" @click="emit('novo')">
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Parceiro
      </UiButton>
    </div>
  </header>
</template>
