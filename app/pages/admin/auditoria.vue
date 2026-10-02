<script setup lang="ts">
import { ref } from 'vue'
import type { RegistroAuditoria } from '../../components/auditoria/useAuditoriaDemo'

definePageMeta({ layout: 'admin' })

// Coordenação entre painéis (state dos filtros fica no composable)
const filtrosAbertos = ref(false)
const detalheAberto = ref(false)
const registroDetalhe = ref<RegistroAuditoria | null>(null)

const abrirDetalhe = (registro: RegistroAuditoria) => {
  registroDetalhe.value = registro
  detalheAberto.value = true
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-6xl">
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