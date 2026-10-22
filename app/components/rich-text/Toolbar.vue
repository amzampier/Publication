<script setup lang="ts">
// Toolbar interna do texto rico (usada pela toolbar acoplada ao campo e pela
// bubble de seleção). Não é um componente do kit público: existe só para não
// duplicar os controles de negrito/cor/tamanho.
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { Bold, Palette, Type } from '@lucide/vue'
import { CORES_TEXTO_RICO, TAMANHOS_TEXTO_RICO } from '#shared/rich-text'

const props = defineProps<{ editor: Editor }>()

const raiz = ref<HTMLElement | null>(null)
const corAberta = ref(false)
const tamAberta = ref(false)
const estado = reactive({ negrito: false, cor: '', tamanho: '' })

const atualizar = () => {
  estado.negrito = props.editor.isActive('bold')
  const atributos = props.editor.getAttributes('textStyle')
  estado.cor = typeof atributos.color === 'string' ? atributos.color : ''
  estado.tamanho = typeof atributos.fontSize === 'string' ? atributos.fontSize : ''
}

const aoClicarFora = (evento: PointerEvent) => {
  if (raiz.value && !raiz.value.contains(evento.target as Node)) {
    corAberta.value = false
    tamAberta.value = false
  }
}

onMounted(() => {
  atualizar()
  props.editor.on('transaction', atualizar)
  document.addEventListener('pointerdown', aoClicarFora)
})
onBeforeUnmount(() => {
  props.editor.off('transaction', atualizar)
  document.removeEventListener('pointerdown', aoClicarFora)
})

const alternarNegrito = () => {
  props.editor.chain().focus().toggleBold().run()
  atualizar()
}

const aplicarCor = (cor: string) => {
  if (cor) props.editor.chain().focus().setColor(cor).run()
  else props.editor.chain().focus().unsetColor().run()
  corAberta.value = false
  atualizar()
}

const aplicarTamanho = (tamanho: string) => {
  if (tamanho) props.editor.chain().focus().setFontSize(tamanho).run()
  else props.editor.chain().focus().unsetFontSize().run()
  tamAberta.value = false
  atualizar()
}
</script>

<template>
  <div ref="raiz" class="flex items-center gap-0.5" role="toolbar" aria-label="Formatação do texto">
    <button
      type="button"
      aria-label="Negrito"
      :aria-pressed="estado.negrito"
      class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-focus"
      :class="estado.negrito ? 'bg-slate-100 text-slate-900' : 'text-slate-600'"
      @mousedown.prevent
      @click="alternarNegrito"
    >
      <Bold class="h-3.5 w-3.5" aria-hidden="true" />
    </button>

    <div class="relative">
      <button
        type="button"
        aria-label="Cor do texto"
        :aria-expanded="corAberta"
        class="flex h-6 w-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-focus"
        @mousedown.prevent
        @click="corAberta = !corAberta"
      >
        <span
          v-if="estado.cor"
          class="h-3.5 w-3.5 rounded-sm border border-slate-300"
          :style="{ backgroundColor: estado.cor }"
          aria-hidden="true"
        ></span>
        <Palette v-else class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div
        v-if="corAberta"
        class="absolute left-0 top-7 z-30 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-slate-600 hover:bg-slate-100"
          @mousedown.prevent
          @click="aplicarCor('')"
        >
          <span class="h-3 w-3 rounded-sm border border-slate-300" aria-hidden="true"></span>
          Padrão
        </button>
        <button
          v-for="cor in CORES_TEXTO_RICO"
          :key="cor.valor"
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-slate-700 hover:bg-slate-100"
          @mousedown.prevent
          @click="aplicarCor(cor.valor)"
        >
          <span
            class="h-3 w-3 rounded-sm border border-slate-300"
            :style="{ backgroundColor: cor.valor }"
            aria-hidden="true"
          ></span>
          {{ cor.rotulo }}
        </button>
      </div>
    </div>

    <div class="relative">
      <button
        type="button"
        aria-label="Tamanho da fonte"
        :aria-expanded="tamAberta"
        class="flex h-6 w-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-focus"
        @mousedown.prevent
        @click="tamAberta = !tamAberta"
      >
        <Type class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div
        v-if="tamAberta"
        class="absolute right-0 top-7 z-30 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      >
        <button
          v-for="tamanho in TAMANHOS_TEXTO_RICO"
          :key="tamanho.valor"
          type="button"
          class="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] text-slate-700 hover:bg-slate-100"
          @mousedown.prevent
          @click="aplicarTamanho(tamanho.valor)"
        >
          <span>{{ tamanho.rotulo }}</span>
          <span
            v-if="estado.tamanho === tamanho.valor"
            class="text-[10px] font-bold text-brand-focus"
            aria-hidden="true"
            >•</span
          >
        </button>
        <button
          type="button"
          class="flex w-full items-center rounded px-2 py-1 text-left text-[11px] text-slate-600 hover:bg-slate-100"
          @mousedown.prevent
          @click="aplicarTamanho('')"
        >
          Padrão
        </button>
      </div>
    </div>
  </div>
</template>
