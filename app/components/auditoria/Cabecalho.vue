<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ScrollText, Download, FileSpreadsheet, ChevronDown, DownloadIcon } from '@lucide/vue'
import { useAuditoriaDemo, formatarDataHora } from './useAuditoriaDemo'
import { gerarPdfAuditoria } from './gerarPdfAuditoria'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'

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

// Exportação sobre os registros filtrados (fase 1 — tudo em memória)
const { registrosFiltrados, filtros, periodoRotulo } = useAuditoriaDemo()
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = () => {
  menuAberto.value = false
  const escapar = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const cabecalho = ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes', 'IP']
  const linhas = registrosFiltrados.value.map((r) =>
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
}

const baixarPdf = async () => {
  menuAberto.value = false
  try {
    await gerarPdfAuditoria({
      registros: registrosFiltrados.value,
      filtros: filtros.value,
      periodoRotulo: periodoRotulo.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio:', erro)
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

    <div ref="exportarRef" class="relative shrink-0 w-full sm:w-auto">
      <UiButton
        variant="outline"
        size="md"
        class="w-full sm:w-auto"
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