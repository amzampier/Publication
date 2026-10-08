<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

/** Campo de texto multilinha do kit (docs/01 §5.18) — mesmo contrato visual e de
 *  acessibilidade do `UiInput`: foco recortado `.ds-bottom-clip` em `brand-focus`,
 *  erro em `rose-700` com ícone+tooltip e mensagem `sr-only` `role="alert"`
 *  associada por `aria-describedby`. Enter quebra linha (comportamento nativo) e
 *  Tab sai do campo. */
interface Props {
  modelValue?: string
  label?: string
  labelClass?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  /** Linhas visíveis do campo (padrão 3). */
  rows?: number
  textareaClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  labelClass: '',
  placeholder: '',
  disabled: false,
  error: '',
  rows: 3,
  textareaClass: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isFocused = ref(false)
const textareaId = useId()
// Id estável da mensagem de erro — referenciada por aria-describedby no textarea
// e renderizada como região viva (role="alert") abaixo do campo.
const erroId = `${textareaId}-erro`

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <!-- Label do Campo -->
    <label
      v-if="label"
      :for="textareaId"
      :class="[
        'text-xs font-bold select-none flex items-center justify-between',
        error ? 'text-rose-700' : 'text-slate-700',
        labelClass
      ]"
    >
      <span>{{ label }}</span>
      <slot name="labelRight" />
    </label>

    <!-- Container do Textarea -->
    <div
      :class="[
        'relative flex items-stretch border border-slate-200 rounded-lg transition-all',
        disabled ? 'bg-slate-200 cursor-not-allowed opacity-60' : 'bg-white hover:border-slate-300'
      ]"
    >
      <!-- Destaque de Foco: só a borda inferior e os dois cantos arredondados inferiores -->
      <span
        v-if="isFocused && !error"
        class="absolute -inset-[1px] rounded-lg border-2 border-brand-focus pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Destaque de Erro: mesmo recorte em rose-700, com precedência sobre o foco -->
      <span
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Textarea (sem outline/box-shadow do navegador) -->
      <textarea
        :id="textareaId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        :aria-describedby="error ? erroId : undefined"
        :class="[
          'w-full min-h-[70px] bg-transparent text-slate-900 text-xs leading-relaxed placeholder:text-slate-400 resize-y font-normal',
          'border-none outline-none focus:outline-none ring-0 focus:ring-0 disabled:cursor-not-allowed',
          'px-3.5 py-2.5',
          error ? 'pr-9' : '',
          textareaClass
        ]"
        style="outline: none !important; box-shadow: none !important;"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Erro: ícone interno no canto superior direito, com tooltip da mensagem -->
      <div v-if="error" class="absolute right-2.5 top-2 flex items-center">
        <Tooltip :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="text-rose-700 hover:text-rose-800 border-none outline-none focus:outline-none ring-0 focus:ring-0 flex items-center p-0.5"
            style="outline: none !important; box-shadow: none !important;"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Erro: visualmente só o AlertCircle interno + borda vermelha (sem texto abaixo);
         a mensagem permanece no DOM oculta (sr-only), anunciada por role="alert" e
         referenciada pelo aria-describedby do textarea. -->
    <p v-if="error" :id="erroId" role="alert" class="sr-only">
      {{ error }}
    </p>
  </div>
</template>
