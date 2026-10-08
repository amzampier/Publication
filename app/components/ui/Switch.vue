<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  /** Nome acessível quando não há `label` visível (ex.: interruptor de célula em tabela). */
  ariaLabel?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  ariaLabel: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const switchId = useId()

// Botão nativo: Space/Enter alternam nativamente; `disabled` sai do Tab e bloqueia clique.
const alternar = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <button
      :id="switchId"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="!label && ariaLabel ? ariaLabel : undefined"
      :disabled="disabled"
      :class="[
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        modelValue ? 'bg-brand-focus' : 'bg-slate-300'
      ]"
      @click="alternar"
    >
      <!-- Knob: desloca 16px (36 - 20 + margem); posição inicial 2px. -->
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform"
        :class="modelValue ? 'translate-x-4' : 'translate-x-0.5'"
      />
    </button>
    <label
      v-if="label"
      :for="switchId"
      class="text-xs font-medium select-none"
      :class="disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'"
    >
      {{ label }}
    </label>
  </div>
</template>
