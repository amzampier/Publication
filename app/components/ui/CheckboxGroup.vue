<script setup lang="ts">
import { computed } from 'vue'
import Checkbox, { type CheckboxVariant } from './Checkbox.vue'
import BadgeCheckbox from './BadgeCheckbox.vue'
import CheckChip from './CheckChip.vue'

export interface CheckboxGroupOption {
  value: any
  label: string
  description?: string
  badge?: string
  badgeVariant?: any
  count?: number | string
  disabled?: boolean
}

export type CheckboxGroupLayout = 'vertical' | 'horizontal' | 'grid-2' | 'grid-3'
export type CheckboxGroupType = 'normal' | 'badge' | 'chip'

interface Props {
  modelValue?: any[]
  options: CheckboxGroupOption[]
  label?: string
  showSelectAll?: boolean
  selectAllLabel?: string
  layout?: CheckboxGroupLayout
  type?: CheckboxGroupType
  variant?: CheckboxVariant
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  showSelectAll: false,
  selectAllLabel: 'Selecionar Todos',
  layout: 'vertical',
  type: 'normal',
  variant: 'lime',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
  (e: 'change', value: any[]): void
}>()

// Itens válidos disponíveis (não desabilitados)
const enabledOptions = computed(() => {
  return props.options.filter((opt) => !opt.disabled && !props.disabled)
})

// Verificar estado de seleção do grupo
const isAllSelected = computed(() => {
  if (enabledOptions.value.length === 0) return false
  return enabledOptions.value.every((opt) => props.modelValue.includes(opt.value))
})

const isIndeterminate = computed(() => {
  const selectedCount = enabledOptions.value.filter((opt) =>
    props.modelValue.includes(opt.value)
  ).length
  return selectedCount > 0 && selectedCount < enabledOptions.value.length
})

// Alternar Selecionar Todos
const toggleSelectAll = (checked: boolean) => {
  let nextValue: any[]

  if (checked) {
    // Adicionar todos os enabledOptions que não estão selecionados
    const newItems = enabledOptions.value
      .map((opt) => opt.value)
      .filter((val) => !props.modelValue.includes(val))
    nextValue = [...props.modelValue, ...newItems]
  } else {
    // Remover todos os enabledOptions
    const enabledVals = enabledOptions.value.map((opt) => opt.value)
    nextValue = props.modelValue.filter((val) => !enabledVals.includes(val))
  }

  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

const updateItem = (itemValue: any, isChecked: boolean) => {
  let next: any[]
  if (isChecked) {
    next = [...props.modelValue, itemValue]
  } else {
    next = props.modelValue.filter((v) => v !== itemValue)
  }
  emit('update:modelValue', next)
  emit('change', next)
}

// Emissão comum dos modos normal/badge: valor resultante + change
const handleOptionUpdate = (next: any[]) => {
  emit('update:modelValue', next)
  emit('change', next)
}

// Estilo de layout das opções
const layoutClasses = computed(() => {
  switch (props.layout) {
    case 'horizontal':
      return 'flex flex-wrap items-center gap-4'
    case 'grid-2':
      return 'grid grid-cols-1 sm:grid-cols-2 gap-3'
    case 'grid-3':
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    case 'vertical':
    default:
      return 'flex flex-col gap-2.5'
  }
})
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <!-- Cabeçalho com Label e "Selecionar Todos" -->
    <div
      v-if="label || showSelectAll"
      class="flex items-center justify-between pb-1 border-b border-slate-100"
    >
      <span v-if="label" class="text-xs font-bold text-slate-800 tracking-tight">
        {{ label }}
      </span>

      <!-- Controle Mestre Tri-State -->
      <div v-if="showSelectAll" class="ml-auto">
        <Checkbox
          :label="selectAllLabel"
          :model-value="isAllSelected"
          :indeterminate="isIndeterminate"
          :variant="variant"
          :disabled="disabled || enabledOptions.length === 0"
          size="sm"
          @update:model-value="toggleSelectAll(Boolean($event))"
        />
      </div>
    </div>

    <!-- Lista de Opções -->
    <div :class="layoutClasses">
      <template v-for="opt in options" :key="String(opt.value)">
        <!-- Tipo 1: Normal -->
        <Checkbox
          v-if="type === 'normal'"
          :model-value="modelValue"
          :value="opt.value"
          :label="opt.label"
          :description="opt.description"
          :variant="variant"
          :disabled="disabled || opt.disabled"
          @update:model-value="handleOptionUpdate($event as any[])"
        />

        <!-- Tipo 2: Badge -->
        <BadgeCheckbox
          v-else-if="type === 'badge'"
          :model-value="modelValue"
          :value="opt.value"
          :label="opt.label"
          :badge="opt.badge || 'TAG'"
          :badge-variant="opt.badgeVariant || 'default'"
          :description="opt.description"
          :variant="variant"
          :disabled="disabled || opt.disabled"
          @update:model-value="handleOptionUpdate($event as any[])"
        />

        <!-- Tipo 3: Chip -->
        <CheckChip
          v-else-if="type === 'chip'"
          :model-value="modelValue.includes(opt.value)"
          :label="opt.label"
          :count="opt.count"
          :variant="variant as any"
          :disabled="disabled || opt.disabled"
          @update:model-value="updateItem(opt.value, $event)"
        />
      </template>
    </div>
  </div>
</template>
