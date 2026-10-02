<script setup lang="ts">
import { Clock, Image, PanelLeft, ShieldAlert } from '@lucide/vue'
import type { TabItem } from '../ui/Tabs.vue'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const abas: TabItem[] = [
  { id: 'logomarcas', label: 'Logomarcas & Identidade', icon: Image, cor: '#f59e0b' },
  { id: 'sidebar', label: 'Sidebar & Sessões do Menu', icon: PanelLeft, cor: '#0364f7' },
  { id: 'retencao', label: 'Retenção de Auditoria', icon: Clock, cor: '#0f7a06' },
  { id: 'seguranca', label: 'Segurança & Rate Limits', icon: ShieldAlert, cor: '#be123c' }
]

const selecionar = (id: string) => {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
  emit('change', id)
}
</script>

<template>
  <!-- Container das abas: barra de tablist + área do painel ativo (slot) -->
  <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
    <div class="border-b border-slate-100 px-4 pb-3 pt-4">
      <UiTabs
        :model-value="modelValue"
        id-prefix="config"
        :items="abas"
        aria-label="Seções das configurações globais"
        @update:model-value="selecionar"
      />
    </div>
    <div
      :id="`config-panel-${modelValue}`"
      role="tabpanel"
      :aria-labelledby="`config-tab-${modelValue}`"
      class="p-6"
    >
      <slot />
    </div>
  </div>
</template>
