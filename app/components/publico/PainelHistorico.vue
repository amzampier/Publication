<script setup lang="ts">
import { computed } from 'vue'
import { History } from '@lucide/vue'
import type {
  PublicoFiltrosPainel,
  PublicoReleaseResumoPainel
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    itens: PublicoReleaseResumoPainel[]
    total: number
    pagina: number
    porPagina: number
    software: string
    tipo: string
    opcoes: PublicoFiltrosPainel
    carregando?: boolean
    carregandoMais?: boolean
    erro?: string
    temMais?: boolean
    demo?: boolean
  }>(),
  {
    carregando: false,
    carregandoMais: false,
    erro: '',
    temMais: false,
    demo: false
  }
)

const emit = defineEmits<{
  (e: 'update:software', value: string): void
  (e: 'update:tipo', value: string): void
  (e: 'limpar'): void
  (e: 'carregar-mais'): void
  (e: 'recarregar'): void
}>()

const opcoesSoftware = computed(() => [
  { value: '', label: 'Todos os Softwares' },
  ...props.opcoes.softwares.map((software) => ({ value: software, label: software }))
])

const opcoesTipo = computed(() => [
  { value: '', label: 'Todos os Tipos' },
  ...props.opcoes.tipos.map((tipo) => ({ value: tipo, label: tipo }))
])

const temFiltro = computed(() => Boolean(props.software || props.tipo))
const exibindo = computed(() =>
  props.total === 0
    ? 'Nenhuma release encontrada'
    : `Exibindo ${props.itens.length} de ${props.total} release${props.total === 1 ? '' : 's'}`
)

const atualizarSoftware = (valor: string | number) => {
  emit('update:software', String(valor))
}

const atualizarTipo = (valor: string | number) => {
  emit('update:tipo', String(valor))
}
</script>

<template>
  <section aria-labelledby="painel-historico-titulo" class="min-w-0">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div class="flex items-center gap-2">
        <History class="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        <div>
          <h2 id="painel-historico-titulo" class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Histórico de Releases Week
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Entregas semanais organizadas cronologicamente
          </p>
        </div>
      </div>

      <div class="grid gap-2 sm:grid-cols-2 lg:w-[28rem]">
        <UiSelect
          :model-value="software"
          :options="opcoesSoftware"
          label="Software"
          aria-label="Filtrar histórico por software"
          @update:model-value="atualizarSoftware"
        />
        <UiSelect
          :model-value="tipo"
          :options="opcoesTipo"
          label="Tipo"
          aria-label="Filtrar histórico por tipo"
          @update:model-value="atualizarTipo"
        />
      </div>
    </div>

    <p class="mb-3 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
      {{ carregando ? 'Carregando releases…' : exibindo }}
    </p>

    <div
      v-if="carregando && !itens.length"
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
      ></div>
    </div>

    <UiErrorState
      v-else-if="erro && !itens.length"
      compact
      :message="erro"
      @retry="emit('recarregar')"
    />

    <div v-else-if="itens.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <PublicoPainelReleaseCard
        v-for="release in itens"
        :key="release.id"
        :release="release"
        :demo="demo"
        mostrar-contagens
      />
    </div>

    <div
      v-else
      class="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      <p>
        {{ temFiltro ? 'Nenhuma release encontrada para os filtros selecionados.' : 'Nenhuma release publicada ainda.' }}
      </p>
      <UiButton
        v-if="temFiltro"
        variant="outline"
        size="sm"
        class="mt-3"
        @click="emit('limpar')"
      >
        Limpar filtros
      </UiButton>
    </div>

    <div v-if="erro && itens.length" class="mt-3">
      <UiErrorState compact :message="erro" @retry="emit('recarregar')" />
    </div>

    <div v-if="temMais" class="mt-5 flex justify-center">
      <UiButton
        variant="outline"
        size="sm"
        :loading="carregandoMais"
        @click="emit('carregar-mais')"
      >
        Carregar mais
      </UiButton>
    </div>
  </section>
</template>
