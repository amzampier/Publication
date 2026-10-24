<script setup lang="ts">
import {
  Boxes,
  Plus,
  FileDown,
  FileSpreadsheet,
} from '@lucide/vue'
import { useSoftwaresModelo } from './useSoftwaresModelo'
import { gerarPdfSoftwares } from './gerarPdfSoftwares'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import { useApiFetch } from '../../composables/useApiFetch'

const { can } = usePermissions()

// Abre o fluxo de cadastro (coordenação na página — modal ainda não existe nesta
// fase; a página informa que a ação chega com o backend).
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Exportação sobre o conjunto vigente (filtrado) — spec softwares: sai apenas o
// conjunto filtrado; geração 100% client-side, sem requisição por arquivo.
const { linhas } = useSoftwaresModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = async () => {
  try {
    // Guarda server-side: exige softwares/exportar antes de gerar o arquivo.
    await useApiFetch('/api/softwares', { query: { exportar: '1' } })
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
  exportando.value = true
  try {
    await useApiFetch('/api/softwares', { query: { exportar: '1' } })
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
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
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
      <UiReportMenu
        v-if="can('softwares', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        @select="(id) => (id === 'pdf' ? relacaoSoftwaresPdf() : exportarCsv())"
      />

      <UiButton
        v-if="can('softwares', 'criar')"
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
