<script setup lang="ts">
// Itens de uma Release Week (entregas_itens) em modo SOMENTE LEITURA, carregados
// sob demanda de GET /api/release-week/:id/itens (cache por release no modelo).
import { computed, onMounted, watch } from 'vue'
import { ListChecks, LoaderCircle, AlertTriangle } from '@lucide/vue'
import {
  formatarData,
  useReleaseWeekModelo,
  type StatusItem
} from './useReleaseWeekModelo'

interface Props {
  releaseId: string
  codigo?: string
}

const props = withDefaults(defineProps<Props>(), {
  codigo: ''
})

const { itensDaRelease, itensCarregando, itensErro, carregarItens } = useReleaseWeekModelo()

const itens = computed(() => itensDaRelease(props.releaseId))
const carregando = computed(() => itensCarregando.value[props.releaseId] === true)
const erro = computed(() => itensErro.value[props.releaseId] ?? null)

const recarregar = () => {
  void carregarItens(props.releaseId, true)
}

onMounted(() => {
  void carregarItens(props.releaseId)
})

watch(
  () => props.releaseId,
  (id) => {
    if (id) void carregarItens(id)
  }
)

const VARIANTE_STATUS: Record<StatusItem, 'pending' | 'reconciled' | 'done' | 'publicado'> = {
  Revisar: 'pending',
  Aprovado: 'reconciled',
  Publicar: 'done',
  Publicado: 'publicado'
}
</script>

<template>
  <section :aria-label="`Itens da release ${codigo}`" class="rounded-lg border border-slate-200 bg-white">
    <div class="flex items-center justify-between gap-3 rounded-t-lg border-b border-slate-200 bg-slate-100 px-3 py-2">
      <div class="flex items-center gap-2">
        <ListChecks class="h-3.5 w-3.5 text-brand-structure" aria-hidden="true" />
        <h3 class="text-xs font-semibold text-slate-800">Itens da release</h3>
        <span v-if="codigo" class="font-mono text-[10px] text-slate-500">{{ codigo }}</span>
      </div>
      <span v-if="!carregando && !erro" class="text-[10px] text-slate-500">
        {{ itens.length }} {{ itens.length === 1 ? 'item' : 'itens' }}
      </span>
    </div>

    <div v-if="carregando" class="flex items-center justify-center gap-2 px-3 py-6 text-xs text-slate-500">
      <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
      Carregando itens…
    </div>

    <div v-else-if="erro" class="flex flex-col items-center gap-2 px-3 py-6 text-center text-xs text-rose-700">
      <p class="flex items-center gap-1.5">
        <AlertTriangle class="h-3.5 w-3.5" aria-hidden="true" />
        {{ erro }}
      </p>
      <UiButton variant="outline" size="sm" @click="recarregar">Tentar novamente</UiButton>
    </div>

    <p v-else-if="itens.length === 0" class="px-3 py-6 text-center text-xs text-slate-500">
      Nenhum item vinculado a esta release.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
            <th class="px-3 py-1.5 font-semibold">Chamada</th>
            <th class="px-3 py-1.5 font-semibold">Título</th>
            <th class="px-3 py-1.5 font-semibold">Software</th>
            <th class="px-3 py-1.5 font-semibold">Módulo</th>
            <th class="px-3 py-1.5 font-semibold">Tipo</th>
            <th class="px-3 py-1.5 font-semibold">Impacto</th>
            <th class="px-3 py-1.5 font-semibold">Status</th>
            <th class="px-3 py-1.5 font-semibold">Liberação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in itens" :key="item.id" class="text-[11px] text-slate-700">
            <td class="whitespace-nowrap px-3 py-1.5 font-mono tabular-nums">{{ item.chamada }}</td>
            <td class="min-w-[220px] px-3 py-1.5">{{ item.titulo }}</td>
            <td class="whitespace-nowrap px-3 py-1.5">{{ item.software }}</td>
            <td class="whitespace-nowrap px-3 py-1.5">{{ item.modulo }}</td>
            <td class="whitespace-nowrap px-3 py-1.5">{{ item.tipo }}</td>
            <td class="whitespace-nowrap px-3 py-1.5">{{ item.impacto }}</td>
            <td class="whitespace-nowrap px-3 py-1.5">
              <UiBadge :variant="VARIANTE_STATUS[item.status]" size="sm" :show-icon="false">
                {{ item.status }}
              </UiBadge>
            </td>
            <td class="whitespace-nowrap px-3 py-1.5 font-mono tabular-nums">
              {{ formatarData(item.dataLiberacao) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
