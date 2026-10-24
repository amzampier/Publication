<script setup lang="ts">
import { ref } from 'vue'
// Cabeçalho da tela de Manuais Mensais: tile, menu "Relatórios" (PDF/CSV sobre
// o conjunto vigente) e ação primária "Novo Manual". As exportações validam a
// guarda `exportar` na API antes de gerar o arquivo.
import { BookOpen, Plus, FileDown, FileSpreadsheet } from '@lucide/vue'
import { useManuaisModelo } from './useManuaisModelo'
import { gerarPdfManuais } from './gerarPdfManuais'
import { useApiFetch } from '../../composables/useApiFetch'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'

const emit = defineEmits<{
  (e: 'novo'): void
}>()

const { can } = usePermissions()
const { linhas } = useManuaisModelo()
const { toast } = useToast()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportando = ref(false)

const semDados = (): boolean => {
  if (linhas.value.length > 0) return false
  toast.info('Exportação', 'Não há Manuais Mensais para exportar com os filtros atuais.')
  return true
}

const escapar = (v: string | number) => {
  let texto = String(v)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return `"${texto.replace(/"/g, '""')}"`
}

const descreverDestaques = (linha: (typeof linhas.value)[number]): string => {
  const itens: string[] = []
  if (linha.destaqueMes) itens.push('Destaque do mês')
  if (linha.destaqueSemana) itens.push('Destaque da semana')
  return itens.join(' · ') || '—'
}

const exportarCsv = async () => {
  if (semDados()) return
  try {
    // Guarda server-side: exige manuais/exportar antes de gerar o arquivo.
    await useApiFetch('/api/manuais', { query: { exportar: '1' } })
    const cabecalho = ['Código', 'Título', 'Mês/Ano', 'Status', 'Autor', 'Publicação', 'Destaques']
    const linhasCsv = linhas.value.map((linha) =>
      [
        linha.codigo,
        linha.titulo,
        linha.mesAno,
        linha.status,
        linha.autor,
        linha.dataPublicacao,
        descreverDestaques(linha)
      ]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhasCsv].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manuais-mensais.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar manuais:', erro)
    toast.danger('Exportação', 'Não foi possível exportar os Manuais. Tente novamente.')
  }
}

const relacaoPdf = async () => {
  if (semDados()) return
  exportando.value = true
  try {
    // Guarda server-side: exige manuais/exportar antes de gerar o arquivo.
    await useApiFetch('/api/manuais', { query: { exportar: '1' } })
    await gerarPdfManuais({
      manuais: linhas.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de manuais:', erro)
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
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#f45f71]">
        <BookOpen class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Manuais Mensais</h1>
        <p class="mt-1 text-xs text-slate-500">
          Catálogo mensal de manuais e procedimentos técnicos — mês, status, autor e itens.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('manuais', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('manuais', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Manual
      </UiButton>
    </div>
  </header>
</template>
