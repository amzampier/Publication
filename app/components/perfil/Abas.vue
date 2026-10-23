<script setup lang="ts">
import { Mail, MapPin, ShieldCheck, User } from '@lucide/vue'
import type { TabItem } from '../ui/Tabs.vue'

interface Props {
  modelValue: string
  /** Passa `disabled` ao "Salvar alterações" (flag `alterado` da página) */
  desabilitado?: boolean
  salvando?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  desabilitado: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'salvar'): void
  (e: 'cancelar'): void
}>()

const abas: TabItem[] = [
  { id: 'dados', label: 'Dados Pessoais', icon: User, cor: '#0364f7' },
  { id: 'seguranca', label: 'Segurança', icon: ShieldCheck, cor: '#be123c' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, cor: '#f59e0b' },
  { id: 'email', label: 'E-mail', icon: Mail, cor: '#8b5cf6' }
]

const selecionar = (id: string) => {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
  emit('change', id)
}
</script>

<template>
  <!-- Container das abas: barra de tablist + área do painel ativo (slot) + rodapé de ações -->
  <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
    <div class="border-b border-slate-100 px-4 pb-3 pt-4">
      <UiTabs
        :model-value="modelValue"
        id-prefix="perfil"
        :items="abas"
        aria-label="Seções do perfil"
        @update:model-value="selecionar"
      />
    </div>
    <div
      :id="`perfil-panel-${modelValue}`"
      role="tabpanel"
      :aria-labelledby="`perfil-tab-${modelValue}`"
      class="p-6"
    >
      <slot />
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
      <UiButton variant="outline" size="md" class="w-full sm:w-auto" @click="emit('cancelar')">
        Cancelar
      </UiButton>
      <UiButton
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        :disabled="desabilitado"
        :loading="salvando"
        @click="emit('salvar')"
      >
        Salvar alterações
      </UiButton>
    </div>
  </div>
</template>
