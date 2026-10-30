<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from '@lucide/vue'
import { urlMiniatura } from '#shared/lancar-chamadas'
import type { PublicoEvidencia } from '#shared/publico'

const props = defineProps<{
  evidencias: PublicoEvidencia[]
  titulo: string
}>()

const galeriaAberta = ref(false)
const indice = ref(0)

const total = computed(() => props.evidencias.length)
const imagemAtual = computed(() => props.evidencias[indice.value] ?? null)

const abrir = (posicao: number) => {
  indice.value = posicao
  galeriaAberta.value = true
}

const anterior = () => {
  if (total.value < 2) return
  indice.value = (indice.value - 1 + total.value) % total.value
}

const proxima = () => {
  if (total.value < 2) return
  indice.value = (indice.value + 1) % total.value
}

const altDaImagem = (evidencia: PublicoEvidencia, posicao: number): string =>
  evidencia.alt || `Evidência ${posicao + 1} de ${total.value} da chamada ${props.titulo}`

const usarOriginal = (evento: Event, original: string) => {
  const img = evento.target as HTMLImageElement
  if (img.dataset.fallback === '1') return
  img.dataset.fallback = '1'
  img.src = original
}

const aoTeclaGaleria = (evento: KeyboardEvent) => {
  if (!galeriaAberta.value) return
  if (evento.key === 'ArrowLeft') {
    evento.preventDefault()
    anterior()
  } else if (evento.key === 'ArrowRight') {
    evento.preventDefault()
    proxima()
  }
}

onMounted(() => window.addEventListener('keydown', aoTeclaGaleria))
onBeforeUnmount(() => window.removeEventListener('keydown', aoTeclaGaleria))
</script>

<template>
  <div v-if="evidencias.length" class="mt-4">
    <p
      class="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300"
    >
      <ImageIcon class="h-3.5 w-3.5" aria-hidden="true" />
      EVIDÊNCIAS / TELAS ({{ evidencias.length }})
    </p>

    <ul class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      <li v-for="(evidencia, posicao) in evidencias" :key="evidencia.id">
        <button
          type="button"
          class="group relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus dark:border-slate-700 dark:bg-slate-800"
          :aria-label="`Abrir evidência ${posicao + 1} de ${evidencias.length} da chamada ${titulo}`"
          @click="abrir(posicao)"
        >
          <img
            :src="urlMiniatura(evidencia.url)"
            :alt="altDaImagem(evidencia, posicao)"
            loading="lazy"
            decoding="async"
            class="h-20 w-full object-cover transition-transform group-hover:scale-105"
            @error="usarOriginal($event, evidencia.url)"
          >
          <span
            v-if="evidencias.length > 1"
            class="absolute right-1 bottom-1 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white"
          >
            {{ posicao + 1 }}/{{ evidencias.length }}
          </span>
        </button>
      </li>
    </ul>
  </div>

  <UiModal
    v-model="galeriaAberta"
    size="xl"
    title="Evidências da chamada"
    :subtitle="
      imagemAtual
        ? `${indice + 1} de ${total} - ${titulo}`
        : titulo
    "
    :icon="ImageIcon"
  >
    <div
      class="relative flex min-h-[45vh] items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-3"
    >
      <button
        v-if="total > 1"
        type="button"
        aria-label="Evidência anterior"
        class="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        @click="anterior"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>

      <img
        v-if="imagemAtual"
        :src="imagemAtual.url"
        :alt="altDaImagem(imagemAtual, indice)"
        class="max-h-[70vh] max-w-full object-contain"
      >

      <button
        v-if="total > 1"
        type="button"
        aria-label="Próxima evidência"
        class="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        @click="proxima"
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </div>

    <div v-if="total > 1" class="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
      <button
        v-for="(evidencia, posicao) in evidencias"
        :key="`thumb-${evidencia.id}`"
        type="button"
        :aria-label="`Ver evidência ${posicao + 1}`"
        :aria-current="posicao === indice ? 'true' : undefined"
        class="shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        :class="
          posicao === indice
            ? 'border-brand-focus'
            : 'border-transparent opacity-70 hover:opacity-100'
        "
        @click="indice = posicao"
      >
        <img
          :src="urlMiniatura(evidencia.url)"
          :alt="`Miniatura ${posicao + 1}`"
          loading="lazy"
          decoding="async"
          class="h-14 w-20 object-cover"
          @error="usarOriginal($event, evidencia.url)"
        >
      </button>
    </div>

    <template #footer>
      <UiButton variant="primary" @click="galeriaAberta = false">Fechar</UiButton>
    </template>
  </UiModal>
</template>
