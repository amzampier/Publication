<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, Layers, Activity } from '@lucide/vue'
import { useSoftwaresModelo, type FiltrosSoftwares } from './useSoftwaresModelo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// tabela (spec softwares: sessões Categoria e Situação — UiSelect com '' =
// todas —, com Limpar Filtros à esquerda e Cancelar + Aplicar à direita;
// molde PerfisFiltros/UsuariosFiltros).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoes, limparFiltros } = useSoftwaresModelo()

const rascunho = ref<FiltrosSoftwares>({ ...filtros.value })

// Opções dos UiSelect — o estado vazio ('') é representado pelo placeholder
// ("Todas"), e o X do select (`clearable`) devolve o filtro a "todas".
const opcoesCategoria = computed(() =>
  opcoes.value.categorias.map((c) => ({ value: c, label: c }))
)
const opcoesSituacao = computed(() => opcoes.value.situacoes.map((s) => ({ value: s, label: s })))

// Ao abrir, o modal espelha o estado vigente; Cancelar simplesmente fecha
// (na próxima abertura o watch ressincroniza com o estado vigente).
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosSoftwares = { categoria: '', situacao: '' }

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => {
  emit('update:modelValue', false)
}

// Zera rascunho E estado aplicado com o modal aberto (badge cai a 0 e a base
// completa volta — comportamento espelhado de PerfisFiltros).
const limpar = () => {
  rascunho.value = { ...VAZIO }
  limparFiltros()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Filtros de Softwares"
    subtitle="Categoria e situação"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Categoria" :icon="Layers">
        <UiSelect
          :model-value="rascunho.categoria"
          :options="opcoesCategoria"
          placeholder="Todas as categorias"
          @update:model-value="rascunho.categoria = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Situação" :icon="Activity">
        <UiSelect
          :model-value="rascunho.situacao"
          :options="opcoesSituacao"
          placeholder="Todas as situações"
          @update:model-value="rascunho.situacao = String($event)"
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
