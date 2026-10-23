<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, Activity, CalendarDays, Layers, Boxes } from '@lucide/vue'
import { useEscopoProjetosModelo, type FiltrosEscopo } from './useEscopoProjetosModelo'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoes, limparFiltros } = useEscopoProjetosModelo()
const rascunho = ref<FiltrosEscopo>({ ...filtros.value })

const opcoesStatus = computed(() => opcoes.value.status.map((status) => ({ value: status, label: status })))
const opcoesAno = computed(() => opcoes.value.anos.map((ano) => ({ value: ano, label: ano })))
const opcoesVersao = computed(() =>
  opcoes.value.versoes.map((versao) => ({ value: versao, label: versao }))
)

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosEscopo = { status: '', ano: '', versao: '', software: '' }

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
    size="md"
    title="Filtros de Escopo de Projetos"
    subtitle="Status, ano, versão e software"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <UiModalSection title="Status" :icon="Activity">
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

      <UiModalSection title="Versão" :icon="Layers">
        <UiSelect
          :model-value="rascunho.versao"
          :options="opcoesVersao"
          placeholder="Todas as versões"
          @update:model-value="rascunho.versao = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Software" :icon="Boxes">
        <UiSelect
          :model-value="rascunho.software"
          :options="opcoes.softwares"
          placeholder="Todos os softwares"
          @update:model-value="rascunho.software = String($event)"
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
