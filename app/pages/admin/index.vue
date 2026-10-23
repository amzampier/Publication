<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import { usePainelExecutivo } from '../../composables/usePainelExecutivo'
import { criarPainelVazio } from '#shared/painel-executivo'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const {
  dados,
  ano,
  carregando,
  carregar,
  trocarAno: trocarAnoBase
} = usePainelExecutivo()

const painel = computed(() => dados.value ?? criarPainelVazio(ano.value))
const carregandoInicial = ref(!dados.value)

const avisarFalha = () => {
  toast.danger(
    'Painel Executivo',
    'Não foi possível carregar os indicadores. Verifique a conexão e tente novamente.'
  )
}

const atualizar = async () => {
  if (!(await carregar(true, Boolean(dados.value)))) avisarFalha()
}

const trocarAno = async (novo: number) => {
  if (!(await trocarAnoBase(novo))) avisarFalha()
}

onMounted(async () => {
  if (dados.value) {
    carregandoInicial.value = false
    return
  }
  const ok = await carregar()
  carregandoInicial.value = false
  if (!ok) avisarFalha()
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:px-1 lg:py-8">
    <UiLoading v-if="carregandoInicial" message="Carregando o Painel Executivo..." />

    <div v-else class="mx-auto max-w-[85rem]">
      <PainelCabecalho
        :ano="ano"
        :anos="painel.anosDisponiveis"
        :carregando="carregando"
        @update:ano="trocarAno"
        @atualizar="atualizar"
      />

      <PainelKpis class="mt-6" :kpis="painel.kpis" />

      <div class="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PainelGraficoPublicacoes
          :serie-mensal="painel.serieMensal"
          :serie-anual="painel.serieAnual"
        />
        <PainelGraficoChamadas :serie-mensal="painel.serieMensal" />
      </div>

      <PainelTabelaPublicacoes class="mt-5" :por-publicacao="painel.porPublicacao" />

      <PainelDimensoes
        class="mt-5"
        :por-software="painel.porSoftware"
        :por-tipo="painel.porTipo"
        :por-impacto="painel.porImpacto"
      />

    </div>
  </div>
</template>
