<script setup lang="ts">
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()

// Contrato de transição da fase 1 (spec perfis-acesso): nenhum UiModal nesta página
const avisoProximaEtapa = (acao: string) => {
  toast.info('Perfis de Acesso (RBAC)', `${acao}: funcionalidade disponível na próxima etapa.`)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
      <PerfisCabecalho @novo="avisoProximaEtapa('Novo Perfil')" />

      <PerfisKpis class="mt-6" />

      <PerfisTabela
        class="mt-5"
        @permissoes="avisoProximaEtapa('Configurar permissões')"
        @editar="avisoProximaEtapa('Editar perfil')"
        @excluir="avisoProximaEtapa('Excluir perfil')"
      />
    </div>
  </div>
</template>
