<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { AlertCircle } from '@lucide/vue'

export type ChoiceCardTone = 'sky' | 'emerald' | 'lime' | 'indigo' | 'slate'

export interface ChoiceCardOption {
  value: string
  title: string
  description?: string
  icon?: any
  badge?: string
  badgeVariant?: 'lime' | 'emerald' | 'indigo' | 'slate' | 'neutral'
  tone?: ChoiceCardTone
  disabled?: boolean
  disabledHint?: string
}

interface Props {
  modelValue?: string
  value: string
  title: string
  description?: string
  icon?: any
  badge?: string
  badgeVariant?: 'lime' | 'emerald' | 'indigo' | 'slate' | 'neutral'
  tone?: ChoiceCardTone
  disabled?: boolean
  disabledHint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  description: '',
  badge: '',
  badgeVariant: 'lime',
  icon: undefined,
  tone: 'slate',
  disabled: false,
  disabledHint: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const raiz = ref<HTMLElement | null>(null)
const souPrimeiroNav = ref(false)

const tituloId = useId()
const descId = `${tituloId}-desc`
const hintId = `${tituloId}-hint`

const selecionado = computed(() => props.modelValue === props.value)
const temSelecao = computed(() => props.modelValue !== '')

// Roving tabindex: ponto único de Tab (selecionado; primeiro navegável quando vazio)
const tabIndex = computed(() => {
  if (props.disabled) return -1
  if (selecionado.value) return 0
  if (temSelecao.value) return -1
  return souPrimeiroNav.value ? 0 : -1
})

onMounted(() => {
  const grupo = raiz.value?.closest('[role="radiogroup"]')
  if (!grupo) return
  const navegaveis = grupo.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])')
  souPrimeiroNav.value = navegaveis[0] === raiz.value
})

const selecionar = () => {
  if (props.disabled || selecionado.value) return
  emit('update:modelValue', props.value)
  emit('change', props.value)
}

const aoClique = () => selecionar()

// Navegação entre cartões irmãos do mesmo radiogroup (leitura do valor via data-valor)
const navegar = (passo: number | 'inicio' | 'fim') => {
  const grupo = raiz.value?.closest('[role="radiogroup"]')
  if (!grupo) return
  const irmaos = Array.from(grupo.querySelectorAll<HTMLElement>('[role="radio"]')).filter(
    (el) => el.getAttribute('aria-disabled') !== 'true'
  )
  if (!irmaos.length) return
  const atual = irmaos.indexOf(raiz.value as HTMLElement)
  let destino: number
  if (passo === 'inicio') destino = 0
  else if (passo === 'fim') destino = irmaos.length - 1
  else destino = ((atual + passo) % irmaos.length + irmaos.length) % irmaos.length

  const alvo = irmaos[destino]
  const valor = alvo.dataset.valor
  if (valor !== undefined && valor !== props.modelValue) {
    emit('update:modelValue', valor)
    emit('change', valor)
  }
  nextTick(() => alvo.focus())
}

const aoTecla = (e: KeyboardEvent) => {
  if (props.disabled) return
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault()
    selecionar()
    return
  }
  const acoes: Record<string, number | 'inicio' | 'fim'> = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
    Home: 'inicio',
    End: 'fim'
  }
  const acao = acoes[e.key]
  if (acao === undefined) return
  e.preventDefault()
  navegar(acao)
}

// Tom do cartão selecionado — borda + anel + fundo tingido (mesma família do UiCheckCard)
const TOM_SELECIONADO: Record<ChoiceCardTone, string> = {
  sky: 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500/40 shadow-xs',
  emerald: 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/40 shadow-xs',
  lime: 'border-brand-accent bg-lime-50/30 ring-1 ring-brand-accent/40 shadow-xs',
  indigo: 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30 shadow-xs',
  slate: 'border-slate-800 bg-slate-100 ring-1 ring-slate-800 shadow-xs'
}

const TILE_SELECIONADO: Record<ChoiceCardTone, string> = {
  sky: 'bg-sky-500/15 text-sky-700',
  emerald: 'bg-emerald-500/15 text-emerald-700',
  lime: 'bg-lime-500/15 text-lime-700',
  indigo: 'bg-indigo-500/15 text-indigo-700',
  slate: 'bg-slate-500/15 text-slate-700'
}

const ANEL_PONTO: Record<ChoiceCardTone, string> = {
  sky: 'border-sky-600',
  emerald: 'border-emerald-600',
  lime: 'border-brand-accent',
  indigo: 'border-indigo-600',
  slate: 'border-slate-800'
}

const PINTURA_PONTO: Record<ChoiceCardTone, string> = {
  sky: 'bg-sky-600',
  emerald: 'bg-emerald-600',
  lime: 'bg-brand-accent',
  indigo: 'bg-indigo-600',
  slate: 'bg-slate-800'
}

const BADGE_CLASSE: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  slate: 'bg-brand-primary border-brand-primary text-white',
  neutral: 'bg-slate-100 border-slate-200 text-slate-700',
  lime: 'bg-lime-100 border-lime-200 text-lime-900'
}

const classeCartao = computed(() => {
  const base =
    'rounded-xl border p-4 transition-all duration-150 relative select-none flex flex-col justify-between text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus'
  if (props.disabled) {
    return [base, 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed']
  }
  if (selecionado.value) {
    return [base, TOM_SELECIONADO[props.tone], 'cursor-pointer']
  }
  return [
    base,
    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs cursor-pointer'
  ]
})

const classeTile = computed(() => [
  'p-2 rounded-lg transition-colors shrink-0',
  selecionado.value ? TILE_SELECIONADO[props.tone] : 'bg-slate-100 text-slate-500'
])

const classeBadge = computed(() => [
  'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
  BADGE_CLASSE[props.badgeVariant] ?? BADGE_CLASSE.lime
])
</script>

<template>
  <div
    ref="raiz"
    :data-valor="value"
    role="radio"
    :aria-checked="selecionado"
    :aria-disabled="disabled || undefined"
    :aria-labelledby="tituloId"
    :aria-describedby="[description ? descId : '', disabled && disabledHint ? hintId : ''].filter(Boolean).join(' ') || undefined"
    :tabindex="tabIndex"
    :class="classeCartao"
    @click="aoClique"
    @keydown="aoTecla"
  >
    <div class="flex items-start justify-between gap-3 mb-2.5">
      <div class="flex items-center gap-2.5">
        <div v-if="icon" :class="classeTile">
          <component :is="icon" class="h-4 w-4" />
        </div>
        <span v-if="badge" :class="classeBadge">{{ badge }}</span>
      </div>

      <span
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
        :class="selecionado ? ANEL_PONTO[tone] : 'border-slate-300'"
        aria-hidden="true"
      >
        <span
          v-if="selecionado"
          class="w-2 h-2 rounded-full"
          :class="PINTURA_PONTO[tone]"
        />
      </span>
    </div>

    <div class="flex flex-col gap-1">
      <h4 :id="tituloId" class="text-xs font-bold text-slate-900 leading-snug">
        {{ title }}
      </h4>
      <p v-if="description" :id="descId" class="text-[11px] text-slate-500 leading-relaxed">
        {{ description }}
      </p>
      <p
        v-if="disabled && disabledHint"
        :id="hintId"
        class="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1"
      >
        <AlertCircle class="h-3 w-3 mt-0.5 shrink-0" />
        <span>{{ disabledHint }}</span>
      </p>
    </div>
  </div>
</template>
