<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  Megaphone,
  NotebookText,
  Plus
} from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useApiFetch } from '../../composables/useApiFetch'
import { useToast } from '../../composables/useToast'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import {
  gerarCsvLancarChamadas,
  gerarPdfLancarChamadas
} from './gerarPdfLancarChamadas'

const emit = defineEmits<{
  (e: 'novo'): void
}>()

const { can } = usePermissions()
const { linhas } = useLancarChamadasModelo()
const { toast } = useToast()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const menuAberto = ref(false)
const relatoriosRef = ref<HTMLElement | null>(null)
const exportando = ref(false)

const aoClicarFora = (evento: MouseEvent) => {
  if (relatoriosRef.value && !relatoriosRef.value.contains(evento.target as Node)) {
    menuAberto.value = false
  }
}
const aoKeydown = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') menuAberto.value = false
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
  toast.info('Exportação', 'Não há chamadas para exportar com os filtros atuais.')
  return true
}

const autorizarDownload = async (): Promise<boolean> => {
  try {
    await useApiFetch('/api/lancar-chamadas?download=1')
    return true
  } catch (erro) {
    const e = erro as { statusMessage?: string; data?: { statusMessage?: string } }
    toast.danger(
      'Exportação',
      e?.data?.statusMessage ?? e?.statusMessage ?? 'Você não tem permissão para exportar chamadas.'
    )
    return false
  }
}

const exportarCsv = async () => {
  menuAberto.value = false
  if (semDados()) return
  if (!(await autorizarDownload())) return
  try {
    gerarCsvLancarChamadas(linhas.value)
  } catch (erro) {
    console.error('[csv] falha ao exportar chamadas:', erro)
    toast.danger('Exportação', 'Não foi possível exportar as chamadas. Tente novamente.')
  }
}

const gerarPdf = async () => {
  menuAberto.value = false
  if (semDados()) return
  if (!(await autorizarDownload())) return
  exportando.value = true
  try {
    await gerarPdfLancarChamadas({
      chamadas: linhas.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatório de chamadas:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a listagem em PDF. Tente novamente.')
  } finally {
    exportando.value = false
  }
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#f59e0b]">
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
      <div v-if="can('lancar-chamadas', 'download')" ref="relatoriosRef" class="relative w-full sm:w-auto">
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
            @click="gerarPdf"
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
