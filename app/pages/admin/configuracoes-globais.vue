<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()

// Estado em memória (fase 1 — sem persistência, sem chamada de rede)
const diasRetencao = ref(180)

// Aba padrão: Logomarcas & Identidade (pedido do usuário)
const aba = ref('logomarcas')

// Botão "Salvar" fica desabilitado até qualquer painel alterar seu estado
const alterado = ref(false)

const salvar = () => {
  toast.success(
    'Configurações Globais',
    'As alterações foram salvas com sucesso (apenas demonstração — sem persistência).'
  )
  alterado.value = false
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-5xl">
      <ConfiguracoesCabecalho :desabilitado="!alterado" @salvar="salvar" />

      <ConfiguracoesAbas v-model="aba" class="mt-10">
        <ConfiguracoesAbaLogomarcas
          v-if="aba === 'logomarcas'"
          @change="alterado = true"
        />
        <ConfiguracoesAbaSidebar
          v-else-if="aba === 'sidebar'"
          @change="alterado = true"
        />
        <ConfiguracoesAbaRetencaoAuditoria
          v-else-if="aba === 'retencao'"
          v-model="diasRetencao"
          @change="alterado = true"
        />
        <ConfiguracoesAbaSeguranca v-else @change="alterado = true" />
      </ConfiguracoesAbas>
    </div>
  </div>
</template>
