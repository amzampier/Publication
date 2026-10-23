<script setup lang="ts">
import { computed } from 'vue'

export interface ItemBarraHorizontal {
  rotulo: string
  valor: number
  cor?: string
}

interface Props {
  titulo: string
  descricao?: string
  rotulo: string
  itens: ItemBarraHorizontal[]
  sufixo?: string
  vazio?: string
  cor?: string
}

const props = withDefaults(defineProps<Props>(), {
  descricao: '',
  sufixo: '',
  vazio: 'Sem dados no período.',
  cor: '#0364f7'
})

const maximo = computed(() => Math.max(1, ...props.itens.map((item) => item.valor)))
const temDados = computed(() => props.itens.some((item) => item.valor > 0))

const ariaLabel = computed(() => {
  if (!temDados.value) return `${props.rotulo}: ${props.vazio}`
  return `${props.rotulo}. ${props.itens
    .map((item) => `${item.rotulo}: ${item.valor}${props.sufixo}`)
    .join('; ')}.`
})

const largura = (valor: number): string =>
  valor > 0 ? `${Math.max((valor / maximo.value) * 100, 2)}%` : '0%'
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <header>
      <h3 class="text-sm font-bold text-slate-900">{{ titulo }}</h3>
      <p v-if="descricao" class="mt-0.5 text-[11px] text-slate-500">{{ descricao }}</p>
    </header>

    <p v-if="!temDados" class="mt-5 rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-500">
      {{ vazio }}
    </p>

    <ul v-else class="mt-4 space-y-2.5" role="img" :aria-label="ariaLabel">
      <li v-for="item in itens" :key="item.rotulo" class="min-w-0">
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="truncate text-slate-700" :title="item.rotulo">{{ item.rotulo }}</span>
          <span class="shrink-0 font-mono tabular-nums text-slate-600">{{ item.valor }}{{ sufixo }}</span>
        </div>
        <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: largura(item.valor), backgroundColor: item.cor ?? cor }"
          ></div>
        </div>
      </li>
    </ul>
  </section>
</template>
