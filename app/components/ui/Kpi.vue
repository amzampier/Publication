<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp, TrendingDown, Minus } from '@lucide/vue'

interface Props {
  titulo: string
  valor: string
  cor?: string
  icone?: Component
  metrica?: string
  metricaRotulo?: string
  tendencia?: 'up' | 'down' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  cor: '#2161ef',
  icone: undefined,
  metrica: '',
  metricaRotulo: '',
  tendencia: 'neutral'
})
</script>

<template>
  <article
    class="relative overflow-hidden rounded-2xl border bg-white
           shadow-sm"
    :style="{ borderColor: cor }"
  >
    <!-- Conteúdo acima da onda -->
    <div class="relative z-10 flex items-start gap-3 p-3 pb-[26px] sm:p-4 sm:pb-[34px]">
      <span
        v-if="icone"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        :style="{ backgroundColor: `${cor}1a`, color: cor }"
        aria-hidden="true"
      >
        <component
          :is="icone"
          class="h-4 w-4"
        />
      </span>

      <div class="min-w-0">
        <p class="truncate text-xs font-medium text-slate-500">
          {{ titulo }}
        </p>

        <p class="mt-1 truncate text-2xl font-bold font-mono tabular-nums text-slate-900">
          {{ valor }}
        </p>

        <!-- Métrica de variação abaixo do valor -->
        <div
          v-if="metrica || metricaRotulo"
          class="mt-1 flex items-center gap-1 text-xs"
        >
          <component
            :is="tendencia === 'up' ? TrendingUp : tendencia === 'down' ? TrendingDown : Minus"
            class="h-3.5 w-3.5 shrink-0"
            :class="tendencia === 'up' ? 'text-emerald-600' : tendencia === 'down' ? 'text-rose-600' : 'text-slate-400'"
            aria-hidden="true"
          />
          <span
            v-if="metrica"
            class="font-semibold"
            :class="tendencia === 'up' ? 'text-emerald-600' : tendencia === 'down' ? 'text-rose-600' : 'text-slate-500'"
          >{{ metrica }}</span>
          <span
            v-if="metricaRotulo"
            class="truncate text-slate-400"
          >{{ metricaRotulo }}</span>
        </div>
      </div>
    </div>

    <!-- Onda decorativa animada no rodapé interno, com tile duplicado para loop contínuo -->
    <svg
      class="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full sm:h-10"
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g class="kpi-wave kpi-wave-back">
        <path
          d="M0,58 C50,52 80,30 130,34 C180,38 205,54 255,42 C305,30 345,44 400,58 L400,80 L0,80 Z"
          :fill="cor"
          fill-opacity="0.14"
        />
        <path
          d="M0,58 C50,52 80,30 130,34 C180,38 205,54 255,42 C305,30 345,44 400,58 L400,80 L0,80 Z"
          :fill="cor"
          fill-opacity="0.14"
          transform="translate(400,0)"
        />
      </g>

      <g class="kpi-wave kpi-wave-front">
        <path
          d="M0,66 C60,62 95,44 145,48 C195,52 225,64 275,56 C325,48 360,58 400,66 L400,80 L0,80 Z"
          :fill="cor"
          fill-opacity="0.22"
        />
        <path
          d="M0,66 C60,62 95,44 145,48 C195,52 225,64 275,56 C325,48 360,58 400,66 L400,80 L0,80 Z"
          :fill="cor"
          fill-opacity="0.22"
          transform="translate(400,0)"
        />
      </g>
    </svg>
  </article>
</template>

<style scoped>
@keyframes kpi-wave-drift {
  from {
    transform: translateX(-400px);
  }
  to {
    transform: translateX(0);
  }
}

.kpi-wave {
  animation-name: kpi-wave-drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

.kpi-wave-back {
  animation-duration: 9s;
}

.kpi-wave-front {
  animation-duration: 6s;
}

@media (prefers-reduced-motion: reduce) {
  .kpi-wave {
    animation: none;
  }
}
</style>
