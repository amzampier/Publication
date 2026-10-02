<script setup lang="ts">
import { ref, watch } from 'vue'
import { Funnel } from '@lucide/vue'
import {
  useAuditoriaDemo,
  ACOES,
  dataIsoParaDate,
  dateParaIso,
  type FiltrosAuditoria
} from './useAuditoriaDemo'

// Modal de filtros estruturais — aberto pelo botão "Filtros" da toolbar da
// tabela (spec auditoria: datas inicial/final + usuário/ação/recurso em chips,
// com Limpar Filtros à esquerda e Cancelar + Aplicar à direita).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { filtros, opcoesUsuarios, opcoesRecursos, limparFiltros } = useAuditoriaDemo()

const rascunho = ref<FiltrosAuditoria>({ ...filtros.value })

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
    <!-- Intervalo de datas -->
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

    <!-- Seleção única em chips (sem menu suspenso — evita scrollbar no modal) -->
    <div class="mt-5 space-y-4">
      <div>
        <p class="mb-2 text-xs font-medium text-slate-700">Usuário</p>
        <div class="flex flex-wrap gap-2">
          <UiCheckChip
            label="Todos"
            :model-value="rascunho.usuario === ''"
            @update:model-value="(v: boolean) => { if (v) rascunho.usuario = '' }"
          />
          <UiCheckChip
            v-for="u in opcoesUsuarios"
            :key="u"
            :label="u"
            :model-value="rascunho.usuario === u"
            @update:model-value="(v: boolean) => { if (v) rascunho.usuario = u }"
          />
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-medium text-slate-700">Ação</p>
        <div class="flex flex-wrap gap-2">
          <UiCheckChip
            label="Todas"
            :model-value="rascunho.acao === ''"
            @update:model-value="(v: boolean) => { if (v) rascunho.acao = '' }"
          />
          <UiCheckChip
            v-for="a in ACOES"
            :key="a"
            :label="a"
            :model-value="rascunho.acao === a"
            @update:model-value="(v: boolean) => { if (v) rascunho.acao = a }"
          />
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-medium text-slate-700">Recurso</p>
        <div class="flex flex-wrap gap-2">
          <UiCheckChip
            label="Todos"
            :model-value="rascunho.recurso === ''"
            @update:model-value="(v: boolean) => { if (v) rascunho.recurso = '' }"
          />
          <UiCheckChip
            v-for="r in opcoesRecursos"
            :key="r"
            :label="r"
            :model-value="rascunho.recurso === r"
            @update:model-value="(v: boolean) => { if (v) rascunho.recurso = r }"
          />
        </div>
      </div>
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