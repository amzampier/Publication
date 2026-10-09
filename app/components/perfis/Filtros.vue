<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, ShieldCheck, Activity } from '@lucide/vue'
import { usePerfisDemo, SITUACOES, type FiltrosPerfis } from './usePerfisDemo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// tabela (spec perfis-acesso: sessões Perfil e Status — UiSelect com '' =
// todos —, com Limpar Filtros à esquerda e Cancelar + Aplicar à direita;
// molde exato de UsuariosFiltros).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoesPerfis, limparFiltros } = usePerfisDemo()

const rascunho = ref<FiltrosPerfis>({ ...filtros.value })

// Opções dos UiSelect — o estado vazio ('') é representado pelo placeholder
// ("Todos/Todas"), e o X do select (`clearable`) devolve o filtro a "todos"
const opcoesPerfil = computed(() => opcoesPerfis.value.map((n) => ({ value: n, label: n })))
const opcoesSituacao = computed(() => SITUACOES.map((s) => ({ value: s, label: s })))

// Ao abrir, o modal espelha o estado vigente; Cancelar simplesmente fecha
// (na próxima abertura o watch ressincroniza com o estado vigente)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosPerfis = { perfil: '', situacao: '' }

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => {
  emit('update:modelValue', false)
}

// Zera rascunho E estado aplicado com o modal aberto (badge cai a 0 e a base
// completa volta — comportamento espelhado de UsuariosFiltros)
const limpar = () => {
  rascunho.value = { ...VAZIO }
  limparFiltros()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Filtros de Perfis"
    subtitle="Perfil e status"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Perfil" :icon="ShieldCheck">
        <UiSelect
          :model-value="rascunho.perfil"
          :options="opcoesPerfil"
          placeholder="Todos os perfis"
          @update:model-value="rascunho.perfil = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Status" :icon="Activity">
        <UiSelect
          :model-value="rascunho.situacao"
          :options="opcoesSituacao"
          placeholder="Todos os status"
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
