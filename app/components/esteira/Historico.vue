<script setup lang="ts">
import { ArrowRight, History } from '@lucide/vue'
import {
  VARIANTE_STATUS_CHAMADA,
  formatarDataHora,
  type HistoricoEsteira,
  type StatusChamada
} from './validadores'

interface Props {
  historico: HistoricoEsteira[]
  carregando?: boolean
}

withDefaults(defineProps<Props>(), {
  carregando: false
})

const tempoLegivel = (minutos: number | null): string => {
  if (minutos === null || minutos === undefined) return '—'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas}h ${resto}min` : `${horas}h`
}
</script>

<template>
  <div>
    <div v-if="carregando" class="flex items-center gap-2 py-4 text-xs text-slate-500">
      <History class="h-4 w-4 animate-pulse" aria-hidden="true" />
      Carregando histórico...
    </div>

    <p v-else-if="!historico.length" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
      Nenhuma transição registrada para esta chamada.
    </p>

    <ol v-else class="ml-2 space-y-4 border-l border-slate-200 pl-4">
      <li v-for="evento in historico" :key="evento.id" class="relative">
        <span
          class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-structure"
          aria-hidden="true"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UiBadge
            :variant="VARIANTE_STATUS_CHAMADA[evento.statusAnterior as StatusChamada] ?? 'neutral'"
            size="sm"
            :show-icon="false"
          >
            {{ evento.statusAnterior }}
          </UiBadge>
          <ArrowRight class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <UiBadge
            :variant="VARIANTE_STATUS_CHAMADA[evento.novoStatus as StatusChamada] ?? 'neutral'"
            size="sm"
            :show-icon="false"
          >
            {{ evento.novoStatus }}
          </UiBadge>
          <span class="font-mono text-[10px] tabular-nums text-slate-500">
            {{ formatarDataHora(evento.dataTransicao) }}
          </span>
        </div>

        <p class="mt-1 text-xs font-medium text-slate-700">
          {{ evento.responsavelNome || 'Desconhecido' }}
          <span v-if="evento.responsavelPerfil" class="font-normal text-slate-400">
            · {{ evento.responsavelPerfil }}
          </span>
        </p>

        <p
          v-if="evento.parecer"
          class="mt-1 whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs text-slate-700"
        >
          {{ evento.parecer }}
        </p>

        <p class="mt-1 text-[10px] text-slate-400">
          Critérios de aceite:
          {{ evento.criteriosAtendidos ? 'atendidos' : 'não atendidos' }}
          <span class="mx-1 text-slate-300">·</span>
          Tempo no estágio: {{ tempoLegivel(evento.tempoNoEstagioMinutos) }}
        </p>
      </li>
    </ol>
  </div>
</template>
