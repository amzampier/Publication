<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cloud, Plus, Camera, Trash2 } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

interface Props {
  rotulo?: string
  dica?: string
  sugestao?: string
  aceitar?: string
  multiple?: boolean
  mostrarCamera?: boolean
  preview?: string
  forma?: 'circular' | 'retrato' | 'retangular'
  compacto?: boolean
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  rotulo: 'Arraste os arquivos aqui ou clique para adicionar',
  dica: 'PNG, JPG ou SVG',
  sugestao: '',
  aceitar: '*',
  multiple: false,
  mostrarCamera: true,
  preview: '',
  forma: 'circular',
  compacto: false,
  alt: 'Pré-visualização do arquivo'
})

const emit = defineEmits<{
  (e: 'change', arquivos: File[] | null): void
  (e: 'camera'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const urlInterna = ref('')
const arrastando = ref(false)
const totalSelecionado = ref(0)
const nomesArquivos = ref<string[]>([])

const previewAtual = computed(() => props.preview || urlInterna.value)

const classesRaiz = computed(() => {
  if (arrastando.value) return 'border-dashed border-lime-500 bg-lime-50/60'
  if (previewAtual.value || totalSelecionado.value > 0) return 'border-solid border-slate-200 bg-white'
  return 'border-dashed border-slate-300 bg-slate-50/50 cursor-pointer hover:border-lime-500 hover:bg-lime-50/40'
})

function liberarInterna() {
  if (urlInterna.value) {
    URL.revokeObjectURL(urlInterna.value)
    urlInterna.value = ''
  }
}

function abrirPicker() {
  inputRef.value?.click()
}

function aplicar(arquivos: File[]) {
  if (!arquivos.length) return
  liberarInterna()
  const aceitos = props.multiple ? arquivos : arquivos.slice(0, 1)
  const imagem = aceitos.find(a => a.type.startsWith('image/'))
  if (!props.multiple && imagem) {
    urlInterna.value = URL.createObjectURL(imagem)
  }
  totalSelecionado.value = aceitos.length
  nomesArquivos.value = aceitos.map(a => a.name)
  emit('change', aceitos)
}

function aoSelecionar(ev: Event) {
  const input = ev.target as HTMLInputElement
  aplicar(Array.from(input.files ?? []))
  input.value = ''
}

function aoRemover() {
  liberarInterna()
  totalSelecionado.value = 0
  nomesArquivos.value = []
  emit('change', null)
}

function aoSoltar(ev: DragEvent) {
  arrastando.value = false
  aplicar(Array.from(ev.dataTransfer?.files ?? []))
}
</script>

<template>
  <div
    class="group relative w-full overflow-hidden rounded-xl border-2 transition-colors"
    :class="classesRaiz"
    @dragover.prevent="arrastando = true"
    @dragleave.prevent="arrastando = false"
    @drop.prevent="aoSoltar"
  >
    <!-- Pré-visualização da imagem -->
    <div
      v-if="previewAtual"
      class="relative flex h-28 items-center justify-center bg-slate-50"
      :class="props.compacto ? 'p-1.5' : 'p-2'"
    >
      <img
        :src="previewAtual"
        :alt="props.alt"
        class="drop-shadow-sm"
        :class="props.forma === 'circular'
          ? 'h-24 w-24 rounded-full object-cover'
          : props.forma === 'retrato'
            ? 'h-24 w-[72px] rounded-xl object-cover'
            : 'max-h-20 max-w-full object-contain'"
      >
    </div>

    <!-- Estado vazio: área de upload clicável -->
    <button
      v-else
      type="button"
      class="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
      :class="props.compacto ? 'gap-0.5 px-2 py-2' : 'gap-1 px-4 py-3'"
      @click="abrirPicker"
    >
      <span
        class="flex items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:text-lime-700"
        :class="props.compacto ? 'h-6 w-6' : 'h-8 w-8'"
      >
        <Cloud :class="props.compacto ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
      </span>
      <span class="text-xs font-semibold text-lime-700">{{ props.rotulo }}</span>
      <span class="text-[11px] text-slate-400">{{ props.dica }}</span>
      <span
        v-if="props.sugestao"
        class="text-[11px] text-slate-400"
      >{{ props.sugestao }}</span>
      <div
        v-if="nomesArquivos.length && (props.multiple || !previewAtual)"
        class="flex w-full min-w-0 flex-col items-center gap-0.5"
      >
        <span
          v-for="(nome, i) in nomesArquivos"
          :key="`${nome}-${i}`"
          class="max-w-full truncate text-[11px] font-semibold text-slate-500"
        >
          {{ nome }}
        </span>
        <span
          v-if="props.multiple"
          class="text-[11px] text-slate-400"
        >
          {{ nomesArquivos.length }} arquivo{{ nomesArquivos.length > 1 ? 's' : '' }} selecionado{{ nomesArquivos.length > 1 ? 's' : '' }}
        </span>
      </div>
    </button>

    <!-- Ícones no canto inferior direito: sempre no mobile; no desktop, no hover/foco -->
    <div
      class="absolute z-10 flex opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100"
      :class="props.compacto ? 'bottom-1 right-1 gap-1' : 'bottom-2 right-2 gap-1.5'"
    >
      <Tooltip content="Incluir arquivo" position="top">
        <button
          type="button"
          aria-label="Incluir arquivo"
          class="rounded-lg bg-white/90 shadow-sm backdrop-blur-sm border border-slate-200 flex items-center justify-center text-lime-700 hover:bg-white hover:text-lime-700 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          :class="props.compacto ? 'size-6' : 'size-11 sm:size-8'"
          @click.stop="abrirPicker"
        >
          <Plus :class="props.compacto ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
        </button>
      </Tooltip>

      <Tooltip
        v-if="props.mostrarCamera"
        content="Tirar foto"
        position="top"
      >
        <button
          type="button"
          aria-label="Tirar foto com a câmera"
          class="rounded-lg bg-white/90 shadow-sm backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          :class="props.compacto ? 'size-6' : 'size-11 sm:size-8'"
          @click.stop="emit('camera')"
        >
          <Camera :class="props.compacto ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
        </button>
      </Tooltip>

      <Tooltip content="Excluir" position="top">
        <button
          type="button"
          aria-label="Excluir arquivo"
          class="rounded-lg bg-white/90 shadow-sm backdrop-blur-sm border border-slate-200 flex items-center justify-center text-rose-500 hover:bg-white hover:text-rose-600 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          :class="[
            props.compacto ? 'size-6' : 'size-11 sm:size-8',
            (!previewAtual && totalSelecionado === 0) ? 'opacity-40 cursor-not-allowed' : ''
          ]"
          :disabled="!previewAtual && totalSelecionado === 0"
          @click.stop="aoRemover"
        >
          <Trash2 :class="props.compacto ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
        </button>
      </Tooltip>
    </div>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="props.aceitar"
      :multiple="props.multiple"
      tabindex="-1"
      aria-hidden="true"
      @change="aoSelecionar"
    >
  </div>
</template>
