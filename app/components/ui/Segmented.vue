<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { AlertCircle } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

export type SegmentedTone = 'emerald' | 'slate' | 'navy' | 'rose' | 'sky' | 'indigo' | 'lime'

export interface SegmentedOption {
  value: string
  label: string
  tone?: SegmentedTone
}

interface Props {
  modelValue?: string
  options: SegmentedOption[]
  label?: string
  labelClass?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  labelClass: '',
  error: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const botoes = ref<(HTMLElement | null)[]>([])
const focada = ref(false)

const grupoId = useId()
const labelId = `${grupoId}-label`
const erroId = `${grupoId}-erro`

// Recorte de foco só quando não há erro (erro tem precedência, como no Input)
const onFocusIn = () => {
  focada.value = true
}
const onFocusOut = (e: FocusEvent) => {
  const alvo = e.relatedTarget as HTMLElement | null
  if (!alvo || !rootRef.value?.contains(alvo)) focada.value = false
}

const indiceSelecionado = computed(() =>
  props.options.findIndex((o) => o.value === props.modelValue)
)

// Roving tabindex: ponto único de Tab (segmento marcado; primeiro quando vazio)
const tabIndex = (i: number) => {
  const sel = indiceSelecionado.value
  const ativo = sel === -1 ? 0 : sel
  return ativo === i ? 0 : -1
}

const setRef = (el: unknown, i: number) => {
  botoes.value[i] = el as HTMLElement | null
}

const selecionar = (valor: string) => {
  if (props.disabled || valor === props.modelValue) return
  emit('update:modelValue', valor)
  emit('change', valor)
}

const focarESelecionar = (i: number) => {
  const n = props.options.length
  const idx = ((i % n) + n) % n
  const opt = props.options[idx]
  if (!opt) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  nextTick(() => botoes.value[idx]?.focus())
}

const aoTecla = (e: KeyboardEvent, i: number) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    focarESelecionar(i + 1)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    focarESelecionar(i - 1)
  } else if (e.key === 'Home') {
    e.preventDefault()
    focarESelecionar(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    focarESelecionar(props.options.length - 1)
  }
}

// Tom por opção — mesmas cores semânticas dos KPIs/badges (Ativo emerald-700 = #047857,
// Inativo slate-500 = #64748b)
const TOM_SELECIONADO: Record<SegmentedTone, string> = {
  emerald: 'bg-emerald-700 text-white shadow-xs',
  slate: 'bg-slate-500 text-white shadow-xs',
  navy: 'bg-brand-primary text-white shadow-xs',
  rose: 'bg-rose-700 text-white shadow-xs',
  sky: 'bg-sky-600 text-white shadow-xs',
  indigo: 'bg-indigo-600 text-white shadow-xs',
  lime: 'bg-brand-focus text-white shadow-xs'
}

const classeSegmento = (opt: SegmentedOption) => {
  const selecionado = opt.value === props.modelValue
  const base =
    'flex-1 min-w-0 h-full rounded-md px-1.5 text-xs font-medium flex items-center justify-center transition-all duration-150 outline-none select-none'
  if (props.disabled) {
    return [
      base,
      // Seleção em pílula branca sobre a track slate-200: sem opacity no grupo,
      // o valor escolhido continua legível no estado somente leitura (QA-UX).
      selecionado
        ? 'bg-white text-slate-500 shadow-xs'
        : 'text-slate-400',
      'cursor-not-allowed'
    ]
  }
  if (selecionado) return [base, TOM_SELECIONADO[opt.tone ?? 'navy']]
  return [
    base,
    'text-slate-500 hover:text-slate-800 hover:bg-white/70 cursor-pointer'
  ]
}
</script>

<template>
  <div
    ref="rootRef"
    class="flex flex-col gap-1.5 w-full text-left relative"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <label
      v-if="label"
      :id="labelId"
      :class="[
        'text-xs font-semibold select-none',
        error ? 'text-rose-700' : 'text-slate-700',
        labelClass
      ]"
    >
      <span>{{ label }}</span>
    </label>

    <div class="relative">
      <div
        role="radiogroup"
        :aria-labelledby="label ? labelId : undefined"
        :aria-label="label ? undefined : 'Seleção'"
        :aria-describedby="error ? erroId : undefined"
        :class="[
          'flex items-center gap-0.5 rounded-lg border p-1 h-[34px] transition-all select-none',
          error
            ? 'border-slate-200 pr-7'
            : disabled
              ? 'border-slate-200'
              : 'border-slate-200 hover:border-slate-300',
          disabled ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-100'
        ]"
      >
        <button
          v-for="(opt, i) in options"
          :key="opt.value"
          :ref="(el) => setRef(el, i)"
          type="button"
          role="radio"
          :aria-checked="opt.value === modelValue"
          :tabindex="tabIndex(i)"
          :disabled="disabled"
          :class="classeSegmento(opt)"
          @click="selecionar(opt.value)"
          @keydown="aoTecla($event, i)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Foco canônico: recorte brand-focus só nos cantos inferiores (.ds-bottom-clip) -->
      <span
        v-if="focada && !error && !disabled"
        class="absolute -inset-[1px] rounded-lg border-2 border-brand-focus pointer-events-none transition-all duration-150 ds-bottom-clip"
      />

      <!-- Erro: recorte rose-700 (precedência sobre o foco) -->
      <span
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      />

      <!-- Erro: ícone interno à direita com a mensagem no tooltip -->
      <div
        v-if="error"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 z-10"
      >
        <Tooltip :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="text-rose-700 hover:text-rose-800 flex items-center p-0.5 focus:outline-none"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Erro: sem texto visível abaixo (só recorte, label e ícone); região viva para leitores -->
    <p
      v-if="error"
      :id="erroId"
      role="alert"
      class="sr-only"
    >
      {{ error }}
    </p>
  </div>
</template>
