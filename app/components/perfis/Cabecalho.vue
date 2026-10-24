<script setup lang="ts">
import { ref } from 'vue'
import {
  ShieldCheck,
  Plus,
  FileDown,
  FileSpreadsheet,
} from '@lucide/vue'
import {
  usePerfisModelo,
  contarPermissoes,
  PERMISSOES_POR_PERFIL
} from './usePerfisModelo'
import { gerarPdfPerfis } from './gerarPdfPerfis'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import { useApiFetch } from '../../composables/useApiFetch'

const { can } = usePermissions()

// Abre o modal de cadastro em modo de criação (coordenação na página)
const emit = defineEmits<{
  (e: 'novo'): void
}>()

// Menu "Relatórios" (mini-menu role=menu — molde do UsuariosCabecalho)
// Exportação sobre o conjunto vigente vindo da API (com filtro aplicado, sai
// apenas o conjunto filtrado — spec perfis-acesso; filtros/exportações seguem
// client-side, sem requisição por geração de arquivo)
const { perfisFiltrados, usuariosPorPerfil } = usePerfisModelo()
const { toast } = useToast()
const exportando = ref(false)
const { preview: previewLoginGlobal } = useLogomarcaLogin()

const exportarCsv = async () => {
  try {
    // Guarda server-side: exige perfis-acesso/exportar antes de gerar o arquivo.
    await useApiFetch('/api/perfis', { query: { exportar: '1' } })
    // RL05-B-01: neutraliza fórmula em CSV (Excel/LibreOffice) antes de citar.
    const escapar = (v: string | number) => {
      let texto = String(v)
      if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
      return `"${texto.replace(/"/g, '""')}"`
    }
    const cabecalho = ['Nome', 'Descrição', 'Status', 'Usuários', 'Permissões']
    const linhas = perfisFiltrados.value.map((p) =>
      [
        p.nome,
        p.descricao,
        p.situacao,
        usuariosPorPerfil.value[p.nome] ?? 0,
        `${contarPermissoes(p)}/${PERMISSOES_POR_PERFIL}`
      ]
        .map(escapar)
        .join(';')
    )
    const csv = '\uFEFF' + [cabecalho.map(escapar).join(';'), ...linhas].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'perfis.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (erro) {
    console.error('[csv] falha ao exportar perfis:', erro)
    toast.danger('Exportação', 'Não foi possível exportar os perfis. Tente novamente.')
  }
}

const relacaoPerfisPdf = async () => {
  exportando.value = true
  try {
    await useApiFetch('/api/perfis', { query: { exportar: '1' } })
    await gerarPdfPerfis({
      perfis: perfisFiltrados.value,
      usuariosPorPerfil: usuariosPorPerfil.value,
      logoPreview: previewLoginGlobal.value
    })
  } catch (erro) {
    console.error('[pdf] falha ao gerar o relatorio de perfis:', erro)
    toast.danger('Exportação', 'Não foi possível gerar a relação de perfis. Tente novamente.')
  } finally {
    exportando.value = false
  }
}

const acoesRelatorio: Record<string, () => void> = {
  pdf: relacaoPerfisPdf,
  csv: exportarCsv
}
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#f5b302]">
        <ShieldCheck class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Perfis de Acesso (RBAC)
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Administração dos perfis de acesso — permissões por módulo, usuários vinculados e status.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiReportMenu
        v-if="can('perfis-acesso', 'exportar')"
        :items="[
          { id: 'pdf', label: 'Listagem em PDF', icon: FileDown },
          { id: 'csv', label: 'Exportar em CSV', icon: FileSpreadsheet }
        ]"
        :loading="exportando"
        label="Relatórios"
        @select="(id) => acoesRelatorio[id]?.()"
      />

      <UiButton
        v-if="can('perfis-acesso', 'criar')"
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Perfil
      </UiButton>
    </div>
  </header>
</template>
