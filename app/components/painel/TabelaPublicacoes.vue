<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatarData } from '#shared/lancar-chamadas'
import type { PublicacaoPainel, PublicacoesPainel } from '#shared/painel-executivo'
import { varianteStatus as varianteCanonica } from '#shared/status-badge'

type AbaPublicacao = 'releases' | 'manuais' | 'escopos'

interface Props {
  porPublicacao: PublicacoesPainel
}

const props = defineProps<Props>()
const aba = ref<AbaPublicacao>('releases')

const opcoesAbas = [
  { value: 'releases', label: 'Release Week' },
  { value: 'manuais', label: 'Manuais' },
  { value: 'escopos', label: 'Escopo' }
]

const linhas = computed<PublicacaoPainel[]>(() => props.porPublicacao[aba.value] ?? [])
const tituloAba = computed(() =>
  aba.value === 'releases' ? 'Release Week' : aba.value === 'manuais' ? 'Manuais' : 'Escopo de Projetos'
)

const dominio = computed<'release' | 'manual' | 'escopo'>(() =>
  aba.value === 'releases' ? 'release' : aba.value === 'manuais' ? 'manual' : 'escopo'
)

const varianteStatus = (status: string) => varianteCanonica(dominio.value, status)

const corProgresso = (percentual: number): string =>
  percentual >= 100 ? '#1a9e07' : percentual > 0 ? '#0364f7' : '#94a3b8'
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-bold text-slate-900">Chamadas por publicação</h3>
        <p class="mt-0.5 text-[11px] text-slate-500">
          Total de chamadas vinculadas e progresso do fluxo em {{ tituloAba }}.
        </p>
      </div>
      <UiSegmented
        :model-value="aba"
        :options="opcoesAbas"
        aria-label="Selecionar tipo de publicação"
        @update:model-value="aba = $event as AbaPublicacao"
      />
    </header>

    <div v-if="linhas.length === 0" class="mt-5 rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
      Nenhuma publicação no período.
    </div>

    <div v-else class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[720px] border-collapse text-left" :aria-label="`Chamadas por ${tituloAba}`">
        <thead>
          <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
            <th class="px-3 py-2 font-semibold">Código</th>
            <th class="px-3 py-2 font-semibold">Publicação</th>
            <th class="px-3 py-2 font-semibold">Data</th>
            <th class="px-3 py-2 font-semibold">Status</th>
            <th class="px-3 py-2 text-right font-semibold">Chamadas</th>
            <th class="px-3 py-2 font-semibold">Progresso</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="linha in linhas" :key="linha.id" class="text-[11px] text-slate-700">
            <td class="whitespace-nowrap px-3 py-2 font-mono tabular-nums">{{ linha.codigo }}</td>
            <td class="px-3 py-2">
              <div class="flex min-w-0 items-center gap-1.5">
                <span class="truncate" :title="linha.nome">{{ linha.nome }}</span>
                <UiBadge v-if="linha.arquivada" variant="neutral" size="sm" :show-icon="false">Arquivada</UiBadge>
              </div>
            </td>
            <td class="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-slate-600">
              {{ formatarData(linha.dataPublicacao) }}
            </td>
            <td class="whitespace-nowrap px-3 py-2">
              <UiBadge :variant="varianteStatus(linha.status)" size="sm" :show-icon="false">
                {{ linha.status }}
              </UiBadge>
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
              {{ linha.chamadas }}
            </td>
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{ width: `${linha.percentualFluxo}%`, backgroundColor: corProgresso(linha.percentualFluxo) }"
                  ></div>
                </div>
                <span class="w-9 shrink-0 text-right font-mono tabular-nums text-[10px] text-slate-500">
                  {{ linha.percentualFluxo }}%
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-3 text-[10px] leading-relaxed text-slate-400">
      Uma chamada com dois vínculos (origem Ambos) aparece em mais de uma aba; a soma das abas pode
      superar o total de chamadas.
    </p>
  </section>
</template>
