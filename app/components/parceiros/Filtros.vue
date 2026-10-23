<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, Activity, Map, MapPin } from '@lucide/vue'
import { useParceirosModelo, type FiltrosParceiros } from './useParceirosModelo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// grade (spec parceiros: Situação, Região e Estado — UiSelect com '' = todos —,
// com Limpar Filtros à esquerda e Cancelar + Aplicar à direita).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoes, limparFiltros } = useParceirosModelo()

const rascunho = ref<FiltrosParceiros>({ ...filtros.value })

const opcoesSituacao = computed(() => opcoes.value.situacoes)
const opcoesRegiao = computed(() => opcoes.value.regioes)
const opcoesEstado = computed(() => opcoes.value.estados)

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosParceiros = { situacao: '', regiao: '', estado: '' }

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => {
  emit('update:modelValue', false)
}

const limpar = () => {
  rascunho.value = { ...VAZIO }
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Filtros de Parceiros"
    subtitle="Situação, região e estado"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Situação" :icon="Activity">
        <UiSelect
          :model-value="rascunho.situacao"
          :options="opcoesSituacao"
          placeholder="Todas as situações"
          @update:model-value="rascunho.situacao = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Região" :icon="Map">
        <UiSelect
          :model-value="rascunho.regiao"
          :options="opcoesRegiao"
          placeholder="Todas as regiões"
          @update:model-value="rascunho.regiao = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Estado" :icon="MapPin">
        <UiSelect
          :model-value="rascunho.estado"
          :options="opcoesEstado"
          placeholder="Todos os estados"
          @update:model-value="rascunho.estado = String($event)"
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
