<script setup lang="ts">
import { computed } from 'vue'

export interface SliderMark {
  value: number
  label: string
}

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  marks?: SliderMark[]
  /** Texto acessível do valor — `{n}` é substituído pelo valor corrente */
  valueText?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 30,
  max: 730,
  step: 1,
  marks: undefined,
  valueText: '{n} dias',
  ariaLabel: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

const pct = computed(() => {
  const faixa = props.max - props.min
  if (faixa <= 0) return 0
  return ((props.modelValue - props.min) / faixa) * 100
})

const valueAria = computed(() => props.valueText.replace('{n}', String(props.modelValue)))

const onInput = (event: Event) => {
  const valor = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', valor)
  emit('change', valor)
}
</script>

<template>
  <div class="w-full">
    <input
      type="range"
      class="ds-slider"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :aria-label="ariaLabel"
      :aria-valuetext="valueAria"
      :style="{ '--pct': `${pct}%` }"
      @input="onInput"
    />
    <div
      v-if="marks && marks.length"
      class="flex flex-wrap justify-center sm:justify-between gap-x-2 gap-y-1 mt-2.5 text-[11px] font-medium text-slate-500"
      aria-hidden="true"
    >
      <span v-for="marca in marks" :key="marca.value" class="text-center">
        {{ marca.label }}
      </span>
    </div>
  </div>
</template>
