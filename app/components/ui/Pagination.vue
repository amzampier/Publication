<script setup lang="ts">
import { computed, useId, watch } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'

interface Props {
  /** Página corrente (1-based). */
  modelValue: number
  /** Total de registros do conjunto. */
  total: number
  /** Registros por página. */
  perPage: number
  /** Opções do seletor "Linhas por página". */
  pageSizeOptions?: number[]
  /** Rótulo do conjunto exibido no resumo (ex.: "parceiros"). */
  rotulo?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [5, 10, 20, 50],
  rotulo: 'entradas'
})

const emit = defineEmits<{
  (e: 'update:modelValue', pagina: number): void
  (e: 'update:perPage', porPagina: number): void
}>()

const pageSizeId = useId()

const totalPages = computed(() => Math.ceil(props.total / props.perPage) || 1)

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.modelValue - 1) * props.perPage + 1))
const rangeEnd = computed(() => Math.min(props.modelValue * props.perPage, props.total))

const irPara = (pagina: number) => {
  const alvo = Math.min(Math.max(pagina, 1), totalPages.value)
  if (alvo !== props.modelValue) emit('update:modelValue', alvo)
}

const aoTrocarTamanho = (evento: Event) => {
  const valor = Number((evento.target as HTMLSelectElement).value)
  if (!Number.isFinite(valor) || valor === props.perPage) return
  emit('update:perPage', valor)
  emit('update:modelValue', 1)
}

// Mantém a página dentro dos limites quando o total encolhe (ex.: filtro aplicado).
watch(
  () => [props.total, props.perPage] as const,
  () => {
    const maxPage = Math.ceil(props.total / props.perPage) || 1
    if (props.modelValue > maxPage) emit('update:modelValue', maxPage)
  }
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-xs sm:flex-row"
  >
    <div class="text-[11px] text-slate-600">
      Mostrando <strong class="text-slate-900">{{ rangeStart }}</strong> a
      <strong class="text-slate-900">{{ rangeEnd }}</strong> de
      <strong class="text-slate-900">{{ total }}</strong> {{ rotulo }} exibidas
    </div>

    <div class="flex items-center gap-2.5 text-[11px]">
      <div class="flex items-center gap-1.5 text-slate-600">
        <label :for="pageSizeId">Linhas por página:</label>
        <select
          :id="pageSizeId"
          :value="perPage"
          class="cursor-pointer rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          @change="aoTrocarTamanho"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <span class="text-slate-300">|</span>

      <span class="font-medium text-slate-700">
        Página <strong class="text-slate-900">{{ modelValue }}</strong> de
        <strong class="text-slate-900">{{ totalPages }}</strong>
      </span>

      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="modelValue === 1"
          class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Primeira Página"
          @click="irPara(1)"
        >
          <ChevronsLeft class="h-3 w-3" />
        </button>
        <button
          type="button"
          :disabled="modelValue === 1"
          class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Página Anterior"
          @click="irPara(modelValue - 1)"
        >
          <ChevronLeft class="h-3 w-3" />
        </button>
        <button
          type="button"
          :disabled="modelValue === totalPages"
          class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Próxima Página"
          @click="irPara(modelValue + 1)"
        >
          <ChevronRight class="h-3 w-3" />
        </button>
        <button
          type="button"
          :disabled="modelValue === totalPages"
          class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Última Página"
          @click="irPara(totalPages)"
        >
          <ChevronsRight class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>
