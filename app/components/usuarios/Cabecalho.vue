<script setup lang="ts">
import { ref } from 'vue'
import { Users, Plus, FileText, FileDown, FileSpreadsheet } from '@lucide/vue'
import { formatarUltimoAcesso } from './useUsuariosModelo'
import { useUsuarios } from './useUsuarios'
import { gerarPdfUsuarios } from './gerarPdfUsuarios'
import { gerarPdfFichaCadastral } from './gerarPdfFichaCadastral'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'

const { can } = usePermissions()

// Abre o modal de usuário em modo de criação (coordenação na página da fase 2)
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Menu "Relatórios" (mini-menu role=menu — padrão do menu da conta do AppHeader)
// Exportação sobre o conjunto filtrado COMPLETO (buscado pela API, pois a
// listagem é paginada — change paginacao-server-side-e-performance)
const { buscarParaExportacao, urlExportacaoCsv } = useUsuarios()
const { preview: previewLoginGlobal } = useLogomarcaLogin()
const { toast } = useToast()
const exportando = ref(false)

const exportarCsv = () => {
  window.location.assign(urlExportacaoCsv())
}
const fichaCadastralPdf = async () => {
  exportando.value = true
  try {
    const usuarios = await buscarParaExportacao()
    await gerarPdfFichaCadastral({ usuarios, logoPreview: previewLoginGlobal.value })
  } catch (erro) {
    console.error('[pdf] falha ao gerar a ficha cadastral:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a ficha cadastral. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const relacaoCompletaPdf = async () => {
  exportando.value = true
  try {
    const usuarios = await buscarParaExportacao()
    await gerarPdfUsuarios({ usuarios, logoPreview: previewLoginGlobal.value })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a relação completa. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const acoesRelatorio: Record<string, () => void> = {
  ficha: fichaCadastralPdf,
  pdf: relacaoCompletaPdf,
  csv: exportarCsv
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#b070ef]">
        <Users class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Gestão de Usuários
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Administração de usuários do sistema — perfis de acesso, status e último acesso.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('gestao-usuarios', 'exportar')"
        :items="[
          { id: 'ficha', label: 'Ficha cadastral', icon: FileText },
          { id: 'pdf', label: 'Relação completa', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('gestao-usuarios', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Usuário
      </UiButton>
    </div>
  </header>
</template>
