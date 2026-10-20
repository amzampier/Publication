<script setup lang="ts">
// Itens do projeto em modal SOMENTE LEITURA — não há rota/tela própria para o
// módulo de itens; o CRUD pertence a "Lançar as Chamadas". A grade usa o
// UiDataTable do kit (busca, agrupamento, multi-sort e totalizadores) e os itens
// vêm do dataset em memória nesta fase.
import { computed, watch } from 'vue'
import { ListChecks } from '@lucide/vue'
import type { ColumnDef } from '../../utils/dataGrid'
import {
  formatarData,
  useEscopoProjetosModelo,
  type ProjetoEscopoModelo,
  type StatusItem
} from './useEscopoProjetosModelo'

interface Props {
  modelValue: boolean
  escopo: ProjetoEscopoModelo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { itensDoProjeto, carregarItens, itensCarregando, itensErro } =
  useEscopoProjetosModelo()

const itens = computed(() => (props.escopo ? itensDoProjeto(props.escopo.id) : []))
const carregando = computed(() => (props.escopo ? itensCarregando.value[props.escopo.id] === true : false))
const erro = computed(() => (props.escopo ? itensErro.value[props.escopo.id] ?? null : null))

const tentarNovamente = () => {
  if (props.escopo) void carregarItens(props.escopo.id, true)
}

watch(
  () => [props.modelValue, props.escopo?.id] as const,
  ([aberto, id]) => {
    if (aberto && id) void carregarItens(String(id), Boolean(itensErro.value[String(id)]))
  },
  { immediate: true }
)

const VARIANTE_STATUS: Record<StatusItem, 'pending' | 'reconciled' | 'done'> = {
  Revisar: 'pending',
  Aprovado: 'reconciled',
  Publicar: 'done'
}

const varianteStatus = (valor: string) =>
  VARIANTE_STATUS[valor as StatusItem] ?? 'neutral'

const colunas: ColumnDef[] = [
  { id: 'chamada', header: 'Chamada', accessorKey: 'chamada', minWidth: 110, sortable: true },
  { id: 'titulo', header: 'Título', accessorKey: 'titulo', minWidth: 240, sortable: true },
  {
    id: 'software',
    header: 'Software',
    accessorKey: 'software',
    minWidth: 150,
    sortable: true,
    groupable: true
  },
  {
    id: 'modulo',
    header: 'Módulo',
    accessorKey: 'modulo',
    minWidth: 130,
    sortable: true,
    groupable: true
  },
  {
    id: 'tipo',
    header: 'Tipo',
    accessorKey: 'tipo',
    minWidth: 140,
    sortable: true,
    groupable: true
  },
  {
    id: 'impacto',
    header: 'Impacto',
    accessorKey: 'impacto',
    minWidth: 100,
    sortable: true,
    groupable: true
  },
  {
    id: 'situacao',
    header: 'Situação',
    accessorKey: 'situacao',
    minWidth: 120,
    sortable: true,
    groupable: true
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    minWidth: 110,
    sortable: true,
    groupable: true
  },
  {
    id: 'dataLiberacao',
    header: 'Data de liberação',
    accessorKey: 'dataLiberacao',
    minWidth: 130,
    sortable: true,
    format: (valor) => formatarData(String(valor))
  }
]

const fechar = () => emit('update:modelValue', false)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="xl"
    title="Itens do projeto"
    :subtitle="escopo ? `${escopo.codigo} - ${escopo.nome}` : 'Itens vinculados ao escopo'"
    :icon="ListChecks"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Itens vinculados" :icon="ListChecks">
      <p v-if="carregando" class="py-6 text-center text-xs text-slate-500">
        Carregando itens…
      </p>

      <div v-else-if="erro" class="flex flex-col items-center gap-2 py-6 text-center">
        <p class="text-xs text-rose-700">{{ erro }}</p>
        <UiButton variant="outline" size="sm" @click="tentarNovamente">Tentar novamente</UiButton>
      </div>

      <p v-else-if="!itens.length" class="py-6 text-center text-xs text-slate-500">
        Nenhum item vinculado a este projeto.
      </p>

      <UiDataTable
        v-else
        :data="itens"
        :columns="colunas"
        :default-page-size="10"
        :page-size-options="[10, 20, 50]"
        show-header-top
        row-key="id"
      >
        <template #cell(chamada)="{ value }">
          <span class="font-mono tabular-nums">{{ value }}</span>
        </template>

        <template #cell(status)="{ value }">
          <UiBadge :variant="varianteStatus(value)" size="sm" :show-icon="false">
            {{ value }}
          </UiBadge>
        </template>
      </UiDataTable>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" size="md" @click="fechar">Fechar</UiButton>
    </template>
  </UiModal>
</template>
