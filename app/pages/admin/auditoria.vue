<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuditoriaModelo, type RegistroAuditoria } from '../../components/auditoria/useAuditoriaModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { carregarAuditoria } = useAuditoriaModelo()

// Coordenação entre painéis (state dos filtros fica no composable)
const filtrosAbertos = ref(false)
const detalheAberto = ref(false)
const registroDetalhe = ref<RegistroAuditoria | null>(null)

const abrirDetalhe = (registro: RegistroAuditoria) => {
  registroDetalhe.value = registro
  detalheAberto.value = true
}

// Loading no F5 (padrão Meu Perfil / Configurações Globais): enquanto o GET
// voa, só o overlay — sem conteúdo parcial; falha → toast + tabela vazia
// (a demo antiga nunca aparece fingindo ser persistida).
const carregando = ref(true)

onMounted(async () => {
  carregando.value = true
  const ok = await carregarAuditoria()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Gestão de Auditoria',
      'Não foi possível carregar os registros de auditoria. Verifique a conexão com o banco e recarregue a página.'
    )
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading no F5: enquanto o GET resolve, só o estado de espera -->
    <UiLoading v-if="carregando" message="Carregando auditoria…" />

    <div v-else class="mx-auto max-w-7xl">
      <AuditoriaCabecalho />

      <AuditoriaKpis class="mt-6" />

      <AuditoriaTabela
        class="mt-5"
        @open-filters="filtrosAbertos = true"
        @open-details="abrirDetalhe"
      />

      <AuditoriaFiltros v-model="filtrosAbertos" />
      <AuditoriaDetalhe v-model="detalheAberto" :registro="registroDetalhe" />

      <footer
        class="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500"
      >
        <span>Registros sujeitos à política de retenção de logs de auditoria —</span>
        <NuxtLink
          to="/admin/configuracoes-globais"
          class="font-medium text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus rounded"
        >
          ajustar em Configurações Globais
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>
