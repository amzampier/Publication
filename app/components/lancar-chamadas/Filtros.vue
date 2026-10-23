<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CircleDot,
  Funnel,
  GitBranch,
  Handshake,
  Tag
} from '@lucide/vue'
import {
  useLancarChamadasModelo
} from './useLancarChamadasModelo'
import type { FiltrosChamada } from './validadores'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoes, limparFiltros } = useLancarChamadasModelo()

const VAZIO: FiltrosChamada = {
  status: '',
  tipo: '',
  impacto: '',
  softwareIds: [],
  parceiroId: '',
  origem: '',
  dataLancamentoDe: '',
  dataLancamentoAte: '',
  dataLiberacaoDe: '',
  dataLiberacaoAte: ''
}

const rascunho = ref<FiltrosChamada>({
  ...filtros.value,
  softwareIds: [...filtros.value.softwareIds]
})

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value, softwareIds: [...filtros.value.softwareIds] }
  }
)

const opcoesStatus = computed(() =>
  opcoes.value.status.map((valor) => ({ value: valor, label: valor }))
)
const opcoesTipo = computed(() =>
  opcoes.value.tipos.map((valor) => ({ value: valor, label: valor }))
)
const opcoesImpacto = computed(() =>
  opcoes.value.impactos.map((valor) => ({ value: valor, label: valor }))
)
const opcoesOrigem = computed(() =>
  opcoes.value.origens.map((valor) => ({ value: valor, label: valor }))
)
const opcoesSoftware = computed(() =>
  opcoes.value.softwares.map((software) => ({ value: software.id, label: software.label }))
)
const opcoesParceiro = computed(() =>
  opcoes.value.parceiros.map((parceiro) => ({ value: parceiro.id, label: parceiro.label }))
)

const paraData = (iso: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

const paraIso = (data: Date | null): string => {
  if (!data) return ''
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const definirData = (
  campo:
    | 'dataLancamentoDe'
    | 'dataLancamentoAte'
    | 'dataLiberacaoDe'
    | 'dataLiberacaoAte',
  data: Date | null
) => {
  rascunho.value[campo] = paraIso(data)
}

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

const limpar = () => {
  rascunho.value = { ...VAZIO }
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Filtros de Chamadas"
    subtitle="Status, classifica&#231;&#227;o, software, parceiro, origem e per&#237;odos"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4 sm:grid-cols-3">
      <UiModalSection title="Status" :icon="CircleDot">
        <UiSelect
          :model-value="rascunho.status"
          :options="opcoesStatus"
          aria-label="Filtrar por status"
          placeholder="Todos os status"
          @update:model-value="rascunho.status = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Tipo" :icon="Tag">
        <UiSelect
          :model-value="rascunho.tipo"
          :options="opcoesTipo"
          aria-label="Filtrar por tipo"
          placeholder="Todos os tipos"
          @update:model-value="rascunho.tipo = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Impacto" :icon="AlertTriangle">
        <UiSelect
          :model-value="rascunho.impacto"
          :options="opcoesImpacto"
          aria-label="Filtrar por impacto"
          placeholder="Todos os impactos"
          @update:model-value="rascunho.impacto = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Software" :icon="Boxes">
        <UiMultiSelect
          :model-value="rascunho.softwareIds"
          :options="opcoesSoftware"
          aria-label="Filtrar por softwares"
          placeholder="Todos os softwares"
          @update:model-value="rascunho.softwareIds = $event as string[]"
        />
      </UiModalSection>

      <UiModalSection title="Parceiro" :icon="Handshake">
        <UiSelect
          :model-value="rascunho.parceiroId"
          :options="opcoesParceiro"
          aria-label="Filtrar por parceiro"
          placeholder="Todos os parceiros"
          @update:model-value="rascunho.parceiroId = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Origem" :icon="GitBranch">
        <UiSelect
          :model-value="rascunho.origem"
          :options="opcoesOrigem"
          aria-label="Filtrar por origem"
          placeholder="Todas as origens"
          @update:model-value="rascunho.origem = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Período de lançamento" :icon="CalendarDays">
        <div class="grid gap-3">
          <UiDatePicker
            :model-value="paraData(rascunho.dataLancamentoDe)"
            label="De"
            @update:model-value="definirData('dataLancamentoDe', $event)"
          />
          <UiDatePicker
            :model-value="paraData(rascunho.dataLancamentoAte)"
            label="Até"
            @update:model-value="definirData('dataLancamentoAte', $event)"
          />
        </div>
      </UiModalSection>

      <UiModalSection title="Período de liberação" :icon="CalendarDays">
        <div class="grid gap-3">
          <UiDatePicker
            :model-value="paraData(rascunho.dataLiberacaoDe)"
            label="De"
            @update:model-value="definirData('dataLiberacaoDe', $event)"
          />
          <UiDatePicker
            :model-value="paraData(rascunho.dataLiberacaoAte)"
            label="Até"
            @update:model-value="definirData('dataLiberacaoAte', $event)"
          />
        </div>
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
