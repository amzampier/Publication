<script setup lang="ts">
import { Eye } from '@lucide/vue'
import { formatarDataHora, VARIANTE_POR_ACAO, type RegistroAuditoria } from './useAuditoriaDemo'

defineProps<{
  modelValue: boolean
  registro: RegistroAuditoria | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Detalhe do Registro"
    subtitle="Trilha completa da operação"
    :icon="Eye"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <dl v-if="registro" class="grid gap-3 text-xs">
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <dt class="font-medium text-slate-500">Data / Hora</dt>
        <dd class="text-right font-mono tabular-nums text-slate-900">
          {{ formatarDataHora(registro.registradoEm) }}
        </dd>
      </div>
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <dt class="font-medium text-slate-500">Usuário</dt>
        <dd class="text-right text-slate-900">{{ registro.usuario.nome }}</dd>
      </div>
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <dt class="font-medium text-slate-500">Ação</dt>
        <dd>
          <UiBadge :variant="VARIANTE_POR_ACAO[registro.acao]" size="sm">
            {{ registro.acao }}
          </UiBadge>
        </dd>
      </div>
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <dt class="font-medium text-slate-500">Recurso</dt>
        <dd class="text-right text-slate-900">{{ registro.recurso }}</dd>
      </div>
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <dt class="font-medium text-slate-500">IP de Origem</dt>
        <dd class="text-right font-mono tabular-nums text-slate-900">{{ registro.ip }}</dd>
      </div>
      <div class="flex flex-col gap-1">
        <dt class="font-medium text-slate-500">Detalhes</dt>
        <dd class="text-slate-800 leading-relaxed">{{ registro.detalhes }}</dd>
      </div>
    </dl>

    <template #footer>
      <UiButton variant="primary" @click="emit('update:modelValue', false)">Fechar</UiButton>
    </template>
  </UiModal>
</template>