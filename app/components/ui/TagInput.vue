<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { AlertCircle, X } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

interface Props {
  modelValue?: string[]
  label?: string
  labelClass?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
  /** Quantidade máxima de tags (default 12). */
  max?: number
  /** Comprimento máximo de cada tag (default 30). */
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  labelClass: '',
  placeholder: 'Digite uma tag e pressione Enter',
  disabled: false,
  error: '',
  helperText: '',
  max: 12,
  maxLength: 30
})

const emit = defineEmits<{
  (e: 'update:modelValue', tags: string[]): void
  (e: 'change', tags: string[]): void
}>()

const inputId = useId()
const erroId = `${inputId}-erro`

const entrada = ref('')
const focado = ref(false)
const aviso = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const tags = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

const normalizar = (valor: string) => valor.trim().toLowerCase()

const emitir = (novas: string[]) => {
  emit('update:modelValue', novas)
  emit('change', novas)
}

const adicionarTag = (valor: string): boolean => {
  const tag = valor.trim()
  if (!tag || props.disabled) return false
  if (tags.value.length >= props.max) {
    aviso.value = `Limite de ${props.max} tags atingido. Remova uma tag para adicionar outra.`
    return false
  }
  if (tag.length > props.maxLength) {
    aviso.value = `Cada tag deve ter no máximo ${props.maxLength} caracteres.`
    return false
  }
  if (tags.value.some((existente) => normalizar(existente) === normalizar(tag))) {
    aviso.value = 'Esta tag já foi adicionada.'
    return false
  }
  aviso.value = ''
  emitir([...tags.value, tag])
  return true
}

const adicionar = () => {
  if (adicionarTag(entrada.value)) entrada.value = ''
}

const remover = (indice: number) => {
  if (props.disabled) return
  emitir(tags.value.filter((_, i) => i !== indice))
  aviso.value = ''
  nextTick(() => inputRef.value?.focus())
}

const aoDigitar = (evento: Event) => {
  const valor = (evento.target as HTMLInputElement).value
  aviso.value = ''
  if (!valor.includes(',')) {
    entrada.value = valor
    return
  }
  const partes = valor.split(',')
  entrada.value = partes.pop() ?? ''
  for (const parte of partes) adicionarTag(parte)
}

const aoTecla = (evento: KeyboardEvent) => {
  if (evento.key === 'Enter' || evento.key === ',') {
    evento.preventDefault()
    adicionar()
    return
  }
  if (evento.key === 'Backspace' && !entrada.value && tags.value.length > 0) {
    evento.preventDefault()
    remover(tags.value.length - 1)
  }
}

const focarEntrada = () => {
  if (!props.disabled) inputRef.value?.focus()
}
</script>

<template>
  <div class="flex w-full flex-col gap-1.5 text-left">
    <label
      v-if="label"
      :for="inputId"
      :class="[
        'flex items-center justify-between text-xs font-medium select-none',
        error ? 'text-rose-700' : 'text-slate-700',
        labelClass
      ]"
    >
      <span>{{ label }}</span>
      <slot name="labelRight" />
    </label>

    <div
      :class="[
        'relative flex min-h-[34px] w-full flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-200 opacity-60'
          : 'cursor-text border-slate-200 bg-white hover:border-slate-300',
        error ? 'pr-8' : 'pr-2.5'
      ]"
      @click="focarEntrada"
    >
      <span
        v-if="focado && !error && !disabled"
        class="pointer-events-none absolute -inset-[1px] rounded-lg border-2 border-brand-focus transition-all duration-150 ds-bottom-clip"
        aria-hidden="true"
      />
      <span
        v-if="error"
        class="pointer-events-none absolute -inset-[1px] rounded-lg border-2 border-rose-700 transition-all duration-150 ds-bottom-clip"
        aria-hidden="true"
      />

      <ul
        v-if="tags.length"
        role="list"
        aria-label="Tags adicionadas"
        class="contents"
      >
        <li
          v-for="(tag, indice) in tags"
          :key="`${tag}-${indice}`"
          class="inline-flex max-w-full items-center gap-1 rounded-md border border-lime-300 bg-lime-50 px-2 py-0.5 text-[11px] font-medium text-lime-900"
        >
          <span class="max-w-[12rem] truncate">{{ tag }}</span>
          <button
            type="button"
            :disabled="disabled"
            :aria-label="`Remover tag ${tag}`"
            class="rounded p-0.5 text-lime-800 transition-colors hover:bg-lime-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-50"
            @click.stop="remover(indice)"
          >
            <X class="h-3 w-3" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <input
        :id="inputId"
        ref="inputRef"
        :value="entrada"
        type="text"
        :placeholder="tags.length ? 'Adicionar tag…' : placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :aria-label="label ? undefined : 'Adicionar tag'"
        :aria-describedby="error ? erroId : undefined"
        class="min-w-[8rem] flex-1 border-none bg-transparent text-xs font-normal text-slate-900 placeholder:text-slate-500 outline-none ring-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
        style="outline: none !important; box-shadow: none !important;"
        @input="aoDigitar"
        @keydown="aoTecla"
        @focus="focado = true"
        @blur="focado = false"
      />

      <div v-if="error" class="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
        <Tooltip :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="flex items-center p-0.5 text-rose-700 hover:text-rose-800 focus:outline-none"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>

    <p v-if="error" :id="erroId" role="alert" class="sr-only">
      {{ error }}
    </p>

    <p v-if="aviso" role="status" class="text-[11px] text-amber-700">
      {{ aviso }}
    </p>

    <p v-if="helperText" class="text-[11px] text-slate-500">
      {{ helperText }}
    </p>
  </div>
</template>
