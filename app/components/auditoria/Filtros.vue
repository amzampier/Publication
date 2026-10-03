<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Funnel, CalendarDays, User, Tags } from '@lucide/vue'
import {
  useAuditoriaDemo,
  ACOES,
  dataIsoParaDate,
  dateParaIso,
  type FiltrosAuditoria
} from './useAuditoriaDemo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// tabela (spec auditoria: sessões Período, Usuário e Ação e Recurso — datas em
// UiDatePicker e os demais filtros em UiSelect — com Limpar Filtros à esquerda
// e Cancelar + Aplicar à direita).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoesUsuarios, opcoesRecursos, limparFiltros } = useAuditoriaDemo()

const rascunho = ref<FiltrosAuditoria>({ ...filtros.value })

// Opções dos UiSelect — o estado vazio ('') é representado pelo placeholder
// ("Todos/Todas"), e o X do select (`clearable`) devolve o filtro a "todos"
const opcoesUsuario = computed(() => opcoesUsuarios.value.map((u) => ({ value: u, label: u })))
const opcoesAcao = computed(() => ACOES.map((a) => ({ value: a, label: a })))
const opcoesRecurso = computed(() => opcoesRecursos.value.map((r) => ({ value: r, label: r })))

// Ao abrir, o modal espelha o estado vigente; Cancelar simplesmente fecha
// (na próxima abertura o watch ressincroniza com o estado vigente)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) rascunho.value = { ...filtros.value }
  }
)

const VAZIO: FiltrosAuditoria = { dataInicial: '', dataFinal: '', usuario: '', acao: '', recurso: '' }

const aplicar = () => {
  filtros.value = { ...rascunho.value }
  emit('update:modelValue', false)
}

const cancelar = () => {
  emit('update:modelValue', false)
}

const limpar = () => {
  rascunho.value = { ...VAZIO }
  limparFiltros()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Filtros de Auditoria"
    subtitle="Período, usuário, ação e recurso"
    :icon="Funnel"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <!-- Intervalo de datas -->
      <UiModalSection title="Período" :icon="CalendarDays">
        <div class="grid gap-4 sm:grid-cols-2">
          <UiDatePicker
            :model-value="dataIsoParaDate(rascunho.dataInicial)"
            label="Data Inicial"
            placeholder="DD/MM/AAAA"
            @update:model-value="rascunho.dataInicial = dateParaIso($event)"
          />
          <UiDatePicker
            :model-value="dataIsoParaDate(rascunho.dataFinal)"
            label="Data Final"
            placeholder="DD/MM/AAAA"
            @update:model-value="rascunho.dataFinal = dateParaIso($event)"
          />
        </div>
      </UiModalSection>

      <UiModalSection title="Usuário" :icon="User">
        <UiSelect
          :model-value="rascunho.usuario"
          :options="opcoesUsuario"
          placeholder="Todos os usuários"
          @update:model-value="rascunho.usuario = String($event)"
        />
      </UiModalSection>

      <UiModalSection title="Ação e Recurso" :icon="Tags">
        <UiSelect
          label="Ação"
          :model-value="rascunho.acao"
          :options="opcoesAcao"
          placeholder="Todas as ações"
          @update:model-value="rascunho.acao = String($event)"
        />
        <UiSelect
          label="Recurso"
          :model-value="rascunho.recurso"
          :options="opcoesRecurso"
          placeholder="Todos os recursos"
          @update:model-value="rascunho.recurso = String($event)"
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