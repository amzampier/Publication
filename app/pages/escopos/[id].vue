<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { formatarData } from '#shared/escopo-projetos'
import { usePublicoEscopo } from '../../composables/usePublicoEscopo'

const {
  escopo,
  chamadas,
  total,
  pagina,
  porPagina,
  opcoesPorPagina,
  sistemaSelecionado,
  resumo,
  carregando,
  erro,
  recarregar,
  irParaPagina,
  irParaTamanhoPagina,
  verTodas
} = await usePublicoEscopo()

const exibindo = computed(() => {
  if (carregando.value) return 'Carregando chamadas.'
  if (total.value === 0) return 'Nenhuma chamada encontrada.'
  const quantidade = chamadas.value.length
  return `Exibindo ${quantidade} de ${total.value} ${
    total.value === 1 ? 'chamada' : 'chamadas'
  }`
})

const publicacao = computed(() =>
  escopo.value?.publicadoEm ? formatarData(escopo.value.publicadoEm) : ''
)

const rota = useRoute()

const rolarParaChamada = async (tentativa = 0) => {
  if (!import.meta.client) return
  const hash = rota.hash
  if (!hash.startsWith('#chamada-')) return
  await nextTick()
  const alvo = document.getElementById(hash.slice(1))
  if (!alvo) {
    if (tentativa < 10) {
      window.setTimeout(() => {
        void rolarParaChamada(tentativa + 1)
      }, 50)
    }
    return
  }

  const aplicarScroll = () => {
    const container = document.querySelector<HTMLElement>('[data-publico-shell] main')
    if (!container) return
    const top =
      alvo.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      16
    container.scrollTop = top
  }

  aplicarScroll()
  window.setTimeout(aplicarScroll, 300)
  return
}

watch(
  [() => rota.hash, chamadas, carregando],
  () => {
    void rolarParaChamada()
  },
  { flush: 'post' }
)

onMounted(() => {
  void rolarParaChamada()
})

const titulo = computed(() =>
  escopo.value ? `${escopo.value.nome} - Dicas Teorema` : 'Escopo de Projetos - Dicas Teorema'
)

const descricao = computed(() => {
  if (!escopo.value) return 'Chamadas públicas do Escopo de Projetos da Dicas Teorema.'
  const base = `Chamadas públicas contempladas no escopo ${escopo.value.nome}`
  return sistemaSelecionado.value
    ? `${base}, sistema ${sistemaSelecionado.value}.`
    : `${base}.`
})

useHead({
  title: titulo,
  meta: [{ name: 'description', content: descricao }]
})
</script>

<template>
  <div class="mx-auto max-w-[85rem] px-4 py-6 sm:px-6 lg:px-8">
    <UiErrorState
      v-if="erro"
      :message="erro"
      @retry="recarregar"
    />

    <div
      v-else-if="carregando && !escopo"
      class="space-y-4"
      aria-busy="true"
    >
      <span class="sr-only">Carregando escopo de projetos.</span>
      <div class="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
    </div>

    <template v-else-if="escopo">
      <PublicoEscopoCabecalho :escopo="escopo" :resumo="resumo" />

      <section class="mt-6 min-w-0" aria-labelledby="escopo-chamadas-titulo">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="escopo-chamadas-titulo"
              class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Chamadas contempladas
            </h2>
            <p class="sr-only" aria-live="polite">
              {{ exibindo }}
            </p>
          </div>

          <UiButton
            v-if="sistemaSelecionado"
            variant="outline"
            size="sm"
            @click="verTodas"
          >
            Ver todas as chamadas
          </UiButton>
        </div>

        <div
          v-if="carregando && !chamadas.length"
          class="grid gap-4"
          aria-busy="true"
        >
          <span class="sr-only">Carregando chamadas.</span>
          <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div
          v-else-if="!chamadas.length"
          class="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {{
              sistemaSelecionado
                ? `Nenhuma chamada pública para o sistema ${sistemaSelecionado}.`
                : 'Nenhuma chamada publicada neste escopo.'
            }}
          </p>
          <p
            v-if="sistemaSelecionado && resumo && !resumo.sistemaValido"
            class="mt-1 text-xs text-slate-500 dark:text-slate-400"
          >
            O sistema informado não pertence a este escopo.
          </p>
          <UiButton
            v-if="sistemaSelecionado"
            variant="outline"
            size="sm"
            class="mt-4"
            @click="verTodas"
          >
            Ver todas as chamadas
          </UiButton>
        </div>

        <div v-else class="grid gap-4" :aria-busy="carregando">
          <PublicoEscopoChamadaCard
            v-for="chamada in chamadas"
            :key="chamada.id"
            :chamada="chamada"
            :publicacao="publicacao"
          />
        </div>

        <div v-if="total > 0" class="mt-4">
          <UiPagination
            :model-value="pagina"
            :total="total"
            :per-page="porPagina"
            :page-size-options="opcoesPorPagina"
            rotulo="chamadas"
            @update:model-value="irParaPagina"
            @update:per-page="irParaTamanhoPagina"
          />
        </div>
      </section>
    </template>
  </div>
</template>
