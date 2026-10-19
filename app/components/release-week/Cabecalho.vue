<script setup lang="ts">
// Cabeçalho da tela de Release Week: tile, menu "Relatórios" (PDF/CSV sobre o
// conjunto vigente) e ação primária "Nova Release Week". Sem backend nesta
// fase: as exportações leem o dataset em memória (nenhuma requisição).
import { ref, onMounted, onUnmounted } from 'vue'
import { Rocket, Plus, NotebookText, FileDown, FileSpreadsheet, ChevronDown } from '@lucide/vue'
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

const menuAberto = ref(false)
const relatoriosRef = ref<HTMLElement | null>(null)
const exportando = ref(false)

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

const semDados = (): boolean => {
  if (linhas.value.length > 0) return false
  toast.info('Exportação', 'Não há Release Weeks para exportar com os filtros atuais.')
  return true
}

const exportarCsv = async () => {
  menuAberto.value = false
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
  menuAberto.value = false
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
      <div v-if="can('release-week', 'exportar')" ref="relatoriosRef" class="relative w-full sm:w-auto">
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
          class="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-light text-slate-700 transition-colors hover:bg-slate-100"
            @click="relacaoPdf"
          >
            <FileDown class="h-3.5 w-3.5 shrink-0 text-brand-structure" aria-hidden="true" />
            Listagem em PDF
          </button>
          <div class="my-1 h-px bg-slate-200" role="separator"></div>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-light text-slate-700 transition-colors hover:bg-slate-100"
            @click="exportarCsv"
          >
            <FileSpreadsheet class="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            Exportar em CSV
          </button>
        </div>
      </div>

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
