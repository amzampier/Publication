<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, CircleDot, CalendarDays, UserRound, Star } from '@lucide/vue'
import {
  useManuaisModelo,
  type DestaqueFiltro,
  type FiltrosManuais
} from './useManuaisModelo'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoes, limparFiltros } = useManuaisModelo()

const VAZIO: FiltrosManuais = {
  status: '',
  ano: '',
  mes: '',
  autor: '',
  destaque: ''
}

const rascunho = ref<FiltrosManuais>({ ...filtros.value })

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const opcoesStatus = computed(() => opcoes.value.status.map((s) => ({ value: s, label: s })))
const opcoesAno = computed(() => opcoes.value.anos.map((a) => ({ value: a, label: a })))
const opcoesMes = computed(() => opcoes.value.meses.map((m) => ({ value: m, label: m })))
const opcoesAutor = computed(() => opcoes.value.autores.map((a) => ({ value: a, label: a })))

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

const limpar = () => {
  rascunho.value = { ...VAZIO }
  limparFiltros()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="md"
    title="Filtros de Manuais Mensais"
    subtitle="Status, ano, mês, autor e destaque"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <UiModalSection title="Status" :icon="CircleDot">
        <UiSelect
          :model-value="rascunho.status"
          :options="opcoesStatus"
          placeholder="Todos os status"
          @update:model-value="rascunho.status = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Ano" :icon="CalendarDays">
        <UiSelect
          :model-value="rascunho.ano"
          :options="opcoesAno"
          placeholder="Todos os anos"
          @update:model-value="rascunho.ano = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Mês" :icon="CalendarDays">
        <UiSelect
          :model-value="rascunho.mes"
          :options="opcoesMes"
          placeholder="Todos os meses"
          @update:model-value="rascunho.mes = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Autor" :icon="UserRound">
        <UiSelect
          :model-value="rascunho.autor"
          :options="opcoesAutor"
          placeholder="Todos os autores"
          @update:model-value="rascunho.autor = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Destaque" :icon="Star" class="sm:col-span-2">
        <UiSelect
          :model-value="rascunho.destaque"
          :options="opcoes.destaques"
          placeholder="Todos"
          @update:model-value="rascunho.destaque = String($event) as DestaqueFiltro"
        />
      </UiModalSection>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2.5">
        <UiButton variant="outline" @click="limpar">Limpar Filtros</UiButton>
        <div class="flex items-center gap-2.5">
          <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
          <UiButton variant="primary" @click="aplicar">Aplicar</UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
