<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, User, ShieldCheck } from '@lucide/vue'
import {
  useUsuariosDemo,
  PERFIS,
  STATUSES,
  type FiltrosUsuarios
} from './useUsuariosDemo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// tabela (spec gestao-usuarios: sessões Usuário e Perfil e Status — todos em
// UiSelect com '' = todos —, com Limpar Filtros à esquerda e Cancelar +
// Aplicar à direita; espelho do modal de filtros da Auditoria, design D2).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoesUsuarios, limparFiltros } = useUsuariosDemo()

const rascunho = ref<FiltrosUsuarios>({ ...filtros.value })

// Opções dos UiSelect — o estado vazio ('') é representado pelo placeholder
// ("Todos/Todas"), e o X do select (`clearable`) devolve o filtro a "todos"
const opcoesUsuario = computed(() => opcoesUsuarios.value.map((n) => ({ value: n, label: n })))
const opcoesPerfil = computed(() => PERFIS.map((p) => ({ value: p, label: p })))
const opcoesStatus = computed(() => STATUSES.map((s) => ({ value: s, label: s })))

// Ao abrir, o modal espelha o estado vigente; Cancelar simplesmente fecha
// (na próxima abertura o watch ressincroniza com o estado vigente)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosUsuarios = { usuario: '', perfil: '', status: '' }

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => {
  emit('update:modelValue', false)
}

// Zera rascunho E estado aplicado com o modal aberto (badge cai a 0 e a base
// completa volta — comportamento espelhado do irmão da Auditoria)
const limpar = () => {
  rascunho.value = { ...VAZIO }
  limparFiltros()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Filtros de Usuários"
    subtitle="Usuário, perfil e status"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Usuário" :icon="User">
        <UiSelect
          :model-value="rascunho.usuario"
          :options="opcoesUsuario"
          placeholder="Todos os usuários"
          @update:model-value="rascunho.usuario = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Perfil e Status" :icon="ShieldCheck">
        <UiSelect
          label="Perfil"
          :model-value="rascunho.perfil"
          :options="opcoesPerfil"
          placeholder="Todos os perfis"
          @update:model-value="rascunho.perfil = String($event)"
        />
        <UiSelect
          label="Status"
          :model-value="rascunho.status"
          :options="opcoesStatus"
          placeholder="Todos os status"
          @update:model-value="rascunho.status = String($event)"
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
