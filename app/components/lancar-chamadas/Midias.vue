<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ImagePlus, Trash2 } from '@lucide/vue'

interface Props {
  imagens: string[]
  manualTitulo: string
  linkManual: string
  linkVideo: string
  erroManualTitulo?: string
  erroLinkManual?: string
  erroLinkVideo?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  erroManualTitulo: '',
  erroLinkManual: '',
  erroLinkVideo: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:imagens', imagens: string[]): void
  (e: 'update:manualTitulo', valor: string): void
  (e: 'update:linkManual', valor: string): void
  (e: 'update:linkVideo', valor: string): void
}>()

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

const aviso = ref('')
const sucesso = ref('')
const uploadKey = ref(0)

const lerComoDataUrl = (arquivo: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result ?? ''))
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsDataURL(arquivo)
  })

const incorporarArquivos = async (
  arquivos: File[],
  origem: 'selecao' | 'colagem'
) => {
  if (!arquivos.length) return
  aviso.value = ''
  sucesso.value = ''
  const invalidos: string[] = []
  const validos = arquivos.filter((arquivo) => {
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      invalidos.push(arquivo.name || 'imagem sem nome')
      return false
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      invalidos.push(arquivo.name || 'imagem sem nome')
      return false
    }
    return true
  })

  if (invalidos.length > 0) {
    aviso.value = `Não foi possível adicionar: ${invalidos.join(', ')}. Use PNG, JPG ou WebP com até 5 MB.`
  }

  if (validos.length > 0) {
    try {
      const novas = await Promise.all(validos.map(lerComoDataUrl))
      emit('update:imagens', [...props.imagens, ...novas])
      sucesso.value =
        origem === 'colagem'
          ? `${validos.length} imagem(ns) colada(s) da área de transferência.`
          : `${validos.length} imagem(ns) selecionada(s) para inclusão.`
    } catch {
      aviso.value = 'Não foi possível ler uma das imagens.'
    }
  }
}

const aoSelecionarArquivos = async (arquivos: File[] | null) => {
  if (!arquivos?.length) return
  await incorporarArquivos(arquivos, 'selecao')
  uploadKey.value += 1
}

const aoColar = async (evento: ClipboardEvent) => {
  if (props.disabled || !evento.clipboardData) return
  const arquivos: File[] = []
  for (const item of Array.from(evento.clipboardData.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const arquivo = item.getAsFile()
      if (arquivo) arquivos.push(arquivo)
    }
  }
  if (!arquivos.length) return
  evento.preventDefault()
  await incorporarArquivos(arquivos, 'colagem')
}

onMounted(() => {
  window.addEventListener('paste', aoColar)
})

onUnmounted(() => {
  window.removeEventListener('paste', aoColar)
})

const remover = (indice: number) => {
  if (props.disabled) return
  emit(
    'update:imagens',
    props.imagens.filter((_, i) => i !== indice)
  )
}
</script>

<template>
  <div class="grid gap-4">
    <UiInput
      :model-value="manualTitulo"
      data-campo="manualTitulo"
      label="Título do manual"
      placeholder="Ex.: Manual de fechamento contábil"
      :error="erroManualTitulo"
      :disabled="disabled"
      @update:model-value="emit('update:manualTitulo', $event)"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <UiInput
        :model-value="linkManual"
        data-campo="linkManual"
        label="Link do manual"
        type="url"
        placeholder="https://..."
        :error="erroLinkManual"
        :disabled="disabled"
        @update:model-value="emit('update:linkManual', $event)"
      />
      <UiInput
        :model-value="linkVideo"
        data-campo="linkVideo"
        label="Link do vídeo"
        type="url"
        placeholder="https://..."
        :error="erroLinkVideo"
        :disabled="disabled"
        @update:model-value="emit('update:linkVideo', $event)"
      />
    </div>

    <div class="grid gap-3">
      <div class="flex items-center gap-2">
        <ImagePlus class="h-4 w-4 text-brand-structure" aria-hidden="true" />
        <p class="text-xs font-medium text-slate-700">Imagens de evidência</p>
        <span class="text-[10px] text-slate-400">
          {{ imagens.length }} {{ imagens.length === 1 ? 'imagem' : 'imagens' }}
        </span>
      </div>

      <div v-if="imagens.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="(imagem, indice) in imagens"
          :key="`${imagem.slice(0, 40)}-${indice}`"
          class="group relative overflow-hidden rounded-lg border border-slate-200 bg-white"
        >
          <img
            :src="imagem"
            :alt="`Imagem de evidência ${indice + 1}`"
            class="h-24 w-full object-cover"
          >
          <button
            v-if="!disabled"
            type="button"
            :aria-label="`Remover imagem ${indice + 1}`"
            class="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-rose-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="remover(indice)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-3 py-4 text-center text-[11px] text-slate-500">
        Nenhuma imagem anexada.
      </p>

      <p class="rounded-lg border border-dashed border-brand-focus/40 bg-lime-50/40 px-3 py-2 text-center text-[11px] text-slate-600">
        Dica: copie uma imagem (print, por exemplo) e pressione
        <kbd class="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">Ctrl</kbd>
        +
        <kbd class="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">V</kbd>
        em qualquer lugar desta etapa para colar.
      </p>

      <UiUploadFiles
        v-if="!disabled"
        :key="uploadKey"
        rotulo="Adicionar imagens de evidência"
        dica="PNG, JPG ou WebP — até 5 MB por arquivo"
        aceitar="image/png,image/jpeg,image/webp"
        multiple
        :mostrar-camera="false"
        lista-separada
        rotulo-lista="Imagens selecionadas (serão incorporadas ao salvar)"
        @change="aoSelecionarArquivos"
      />

      <p v-if="aviso" role="status" class="text-[11px] text-amber-700">
        {{ aviso }}
      </p>
      <p v-if="sucesso" role="status" class="text-[11px] text-emerald-700">
        {{ sucesso }}
      </p>
    </div>
  </div>
</template>
