<script setup lang="ts">
// Campo de texto rico do kit (negrito, cor e tamanho) — client-only, pois o
// TipTap depende do DOM. Reproduz o DNA visual do `UiTextarea` (foco recortado
// `.ds-bottom-clip` em `brand-focus`, erro em `rose-700` com ícone+tooltip e
// mensagem `sr-only` `role="alert"`). O `v-model` é o HTML; `update:text` emite
// o texto puro para a validação do formulário.
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { AlertCircle } from '@lucide/vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style'
import Tooltip from './Tooltip.vue'
import RichTextToolbar from '../rich-text/Toolbar.vue'

interface Props {
  modelValue?: string
  label?: string
  labelClass?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  minHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  labelClass: '',
  placeholder: '',
  disabled: false,
  error: '',
  minHeight: 70
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:text', value: string): void
}>()

const editor = shallowRef<Editor | undefined>(undefined)
const vazio = ref(true)
const focado = ref(false)
const campoId = useId()
const erroId = `${campoId}-erro`

const emitirConteudo = () => {
  const instancia = editor.value
  if (!instancia) return
  vazio.value = instancia.isEmpty
  emit('update:modelValue', instancia.getHTML())
  emit('update:text', instancia.getText())
}

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue || '',
    editable: !props.disabled,
    extensions: [
      StarterKit.configure({
        bold: {},
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        heading: false,
        horizontalRule: false,
        link: false,
        underline: false,
        dropcursor: false,
        gapcursor: false,
        trailingNode: false
      }),
      TextStyle,
      Color,
      FontSize
    ],
    editorProps: {
      attributes: {
        id: campoId,
        class:
          'ds-rich-text w-full px-3.5 py-2.5 text-xs leading-relaxed text-slate-900 outline-none',
        style: `min-height: ${props.minHeight}px`,
        'aria-describedby': props.error ? erroId : '',
        'aria-label': props.label || 'Editor de texto rico'
      }
    },
    onUpdate: emitirConteudo,
    onFocus: () => {
      focado.value = true
    },
    onBlur: () => {
      focado.value = false
    }
  })
  vazio.value = editor.value.isEmpty
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

watch(
  () => props.modelValue,
  (valor) => {
    const instancia = editor.value
    if (!instancia) return
    if ((valor || '') === instancia.getHTML()) return
    instancia.commands.setContent(valor || '', { emitUpdate: false })
    vazio.value = instancia.isEmpty
  }
)

watch(
  () => props.disabled,
  (valor) => editor.value?.setEditable(!valor)
)
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <!-- Label do Campo -->
    <label
      v-if="label"
      :for="campoId"
      :class="[
        'text-xs font-medium select-none flex items-center justify-between',
        error ? 'text-rose-700' : 'text-slate-700',
        labelClass
      ]"
    >
      <span>{{ label }}</span>
      <slot name="labelRight" />
    </label>

    <!-- Container do Editor -->
    <div
      :class="[
        'group relative flex items-stretch border border-slate-200 rounded-lg transition-all',
        disabled ? 'bg-slate-200 cursor-not-allowed opacity-60' : 'bg-white hover:border-slate-300'
      ]"
    >
      <!-- Destaque de Foco -->
      <span
        v-if="focado && !error"
        class="absolute -inset-[1px] rounded-lg border-2 border-brand-focus pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Destaque de Erro -->
      <span
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Toolbar acoplada ao campo (hover/foco; sempre visível no toque) -->
      <div
        v-if="editor && !disabled"
        class="absolute right-1.5 top-1.5 z-10 rounded-md border border-slate-200 bg-white/95 p-0.5 shadow-xs transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <RichTextToolbar :editor="editor" />
      </div>

      <!-- Placeholder -->
      <span
        v-if="vazio && placeholder"
        class="pointer-events-none absolute left-3.5 top-2.5 text-xs text-slate-500"
      >
        {{ placeholder }}
      </span>

      <!-- Conteúdo -->
      <EditorContent :editor="editor" class="w-full" />

      <!-- Erro: ícone interno com tooltip da mensagem -->
      <div v-if="error" class="absolute right-2.5 bottom-2 flex items-center">
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

      <!-- Bubble de formatação na seleção -->
      <BubbleMenu
        v-if="editor && !disabled"
        :editor="editor"
        :options="{ placement: 'top', offset: 8 }"
        class="z-40"
      >
        <div class="rounded-md border border-slate-200 bg-white p-0.5 shadow-lg">
          <RichTextToolbar :editor="editor" />
        </div>
      </BubbleMenu>
    </div>

    <!-- Erro acessível (visualmente oculto) -->
    <p v-if="error" :id="erroId" role="alert" class="sr-only">
      {{ error }}
    </p>
  </div>
</template>
