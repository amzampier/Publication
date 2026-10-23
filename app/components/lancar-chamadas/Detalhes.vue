<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  ImagePlus,
  Megaphone
} from '@lucide/vue'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import {
  VARIANTE_STATUS_CHAMADA,
  formatarData,
  formatarDataHora,
  urlMiniatura,
  type ChamadaModelo,
  type OpcaoChamada
} from './validadores'

interface Props {
  modelValue: boolean
  chamada?: ChamadaModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  chamada: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { catalogo } = useLancarChamadasModelo()

const subtitulo = computed(() =>
  props.chamada ? `${props.chamada.chamada} — ${props.chamada.titulo}` : ''
)

const rotulo = (lista: OpcaoChamada[], id: string): string =>
  lista.find((opcao) => opcao.id === id)?.label ?? ''

const vinculos = computed(() => {
  if (!props.chamada) return []
  const chamada = props.chamada
  return [
    { rotulo: 'Release', valor: rotulo(catalogo.value.releases, chamada.releaseId) || '—' },
    { rotulo: 'Manual', valor: rotulo(catalogo.value.manuais, chamada.manualId) || '—' },
    {
      rotulo: 'Escopo de Projetos',
      valor: rotulo(catalogo.value.projetos, chamada.projetoId) || '—'
    }
  ]
})

const galeriaAberta = ref(false)
const indiceImagem = ref(0)
const totalImagens = computed(() => props.chamada?.imagens.length ?? 0)
const imagemAtual = computed(() => props.chamada?.imagens[indiceImagem.value] ?? '')

const abrirGaleria = (indice: number) => {
  indiceImagem.value = indice
  galeriaAberta.value = true
}

const anterior = () => {
  if (totalImagens.value < 2) return
  indiceImagem.value = (indiceImagem.value - 1 + totalImagens.value) % totalImagens.value
}

const proxima = () => {
  if (totalImagens.value < 2) return
  indiceImagem.value = (indiceImagem.value + 1) % totalImagens.value
}

const aoTeclaGaleria = (evento: KeyboardEvent) => {
  if (!galeriaAberta.value) return
  if (evento.key === 'ArrowLeft') {
    evento.preventDefault()
    anterior()
  } else if (evento.key === 'ArrowRight') {
    evento.preventDefault()
    proxima()
  }
}

onMounted(() => window.addEventListener('keydown', aoTeclaGaleria))
onUnmounted(() => window.removeEventListener('keydown', aoTeclaGaleria))

watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) galeriaAberta.value = false
  }
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="xl"
    title="Detalhes da Chamada"
    :subtitle="subtitulo"
    :icon="Megaphone"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="chamada" class="grid gap-4">
      <UiModalSection title="Identificação" :icon="ClipboardList">
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="vinculo in vinculos" :key="vinculo.rotulo">
            <p class="text-[11px] font-medium text-slate-500">{{ vinculo.rotulo }}</p>
            <p class="mt-1 text-xs text-slate-800">{{ vinculo.valor }}</p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Chamada</p>
            <p class="mt-1 font-mono text-sm font-medium tabular-nums text-slate-900">
              {{ chamada.chamada }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[11px] font-medium text-slate-500">Título</p>
            <p class="mt-1 text-sm font-medium text-slate-900">{{ chamada.titulo }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Lançamento</p>
            <p class="mt-1 font-mono text-xs tabular-nums text-slate-800">
              {{ formatarData(chamada.dataLancamento) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Liberação</p>
            <p class="mt-1 font-mono text-xs tabular-nums text-slate-800">
              {{ formatarData(chamada.dataLiberacao) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Status</p>
            <div class="mt-1">
              <UiBadge
                :variant="VARIANTE_STATUS_CHAMADA[chamada.status]"
                size="sm"
                :show-icon="false"
              >
                {{ chamada.status }}
              </UiBadge>
            </div>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Origem</p>
            <div class="mt-1">
              <UiBadge variant="neutral" size="sm">{{ chamada.origem }}</UiBadge>
            </div>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Autor</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.autorNome || '—' }}</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Classificação" :icon="Building2">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Parceiro</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.parceiro || '—' }}</p>
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-[11px] font-medium text-slate-500">Softwares</p>
            <div v-if="chamada.softwares.length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="software in chamada.softwares"
                :key="software"
                class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              >
                {{ software }}
              </span>
            </div>
            <p v-else class="mt-1 text-xs text-slate-500">—</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Módulo</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.modulo || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Menu / funcionalidade</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.menuFuncionalidade || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Tipo</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.tipo }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Impacto</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.impacto }}</p>
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-[11px] font-medium text-slate-500">Tags</p>
            <div v-if="chamada.tags.length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="tag in chamada.tags"
                :key="tag"
                class="rounded-md border border-lime-300 bg-lime-50 px-2 py-0.5 text-[10px] font-semibold text-lime-900"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="mt-1 text-xs text-slate-500">Nenhuma tag.</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Conteúdo" :icon="FileText">
        <div>
          <p class="text-[11px] font-medium text-slate-500">Descrição do Resumo</p>
          <div class="mt-1">
            <UiRichTextViewer :html="chamada.descricaoHtml" :text="chamada.descricaoCompleta" />
          </div>
        </div>
        <div>
          <p class="text-[11px] font-medium text-slate-500">Solução</p>
          <div class="mt-1">
            <UiRichTextViewer :html="chamada.solucaoHtml" :text="chamada.solucao" />
          </div>
        </div>
        <div>
          <p class="text-[11px] font-medium text-slate-500">Título do manual</p>
          <p class="mt-1 text-xs text-slate-800">{{ chamada.manualTitulo || '—' }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Link do manual</p>
            <a
              v-if="chamada.linkManual"
              :href="chamada.linkManual"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block truncate text-xs text-brand-structure underline underline-offset-2 hover:text-brand-focus"
            >
              {{ chamada.linkManual }}
            </a>
            <p v-else class="mt-1 text-xs text-slate-500">—</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Link do vídeo</p>
            <a
              v-if="chamada.linkVideo"
              :href="chamada.linkVideo"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block truncate text-xs text-brand-structure underline underline-offset-2 hover:text-brand-focus"
            >
              {{ chamada.linkVideo }}
            </a>
            <p v-else class="mt-1 text-xs text-slate-500">—</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Imagens" :icon="ImagePlus">
        <div>
          <p class="text-[11px] font-medium text-slate-500">Imagens</p>
          <div v-if="chamada.imagens.length" class="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="(imagem, indice) in chamada.imagens"
              :key="`${indice}-${imagem.slice(0, 24)}`"
              type="button"
              :aria-label="`Abrir imagem ${indice + 1} de ${chamada.imagens.length} em galeria`"
              class="group relative overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="abrirGaleria(indice)"
            >
              <img
                :src="urlMiniatura(imagem)"
                loading="lazy"
                decoding="async"
                :alt="`Imagem de evidência ${indice + 1}`"
                class="h-24 w-full object-cover transition-transform group-hover:scale-105"
              >
              <span
                v-if="chamada.imagens.length > 1"
                class="absolute bottom-1 right-1 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white"
              >
                {{ indice + 1 }}/{{ chamada.imagens.length }}
              </span>
            </button>
          </div>
          <p v-else class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <ImagePlus class="h-3.5 w-3.5" aria-hidden="true" />
            Nenhuma imagem anexada.
          </p>
        </div>
      </UiModalSection>

      <UiModalSection title="Informações de Cadastro" :icon="Eye">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Criado em</p>
            <p class="mt-1 text-xs text-slate-800">{{ formatarDataHora(chamada.criadoEm) }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Atualizado em</p>
            <p class="mt-1 text-xs text-slate-800">{{ formatarDataHora(chamada.atualizadoEm) }}</p>
          </div>
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="primary" @click="emit('update:modelValue', false)">Fechar</UiButton>
    </template>
  </UiModal>

  <UiModal
    v-model="galeriaAberta"
    size="xl"
    title="Imagens da chamada"
    :subtitle="`${indiceImagem + 1} de ${totalImagens}${chamada?.titulo ? ` — ${chamada.titulo}` : ''}`"
    :icon="ImagePlus"
  >
    <div class="relative flex min-h-[45vh] items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-3">
      <button
        v-if="totalImagens > 1"
        type="button"
        aria-label="Imagem anterior"
        class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        @click="anterior"
      >
        <ChevronLeft class="h-5 w-5" />
      </button>

      <img
        v-if="imagemAtual"
        :src="imagemAtual"
        :alt="`Imagem ${indiceImagem + 1} de ${totalImagens} da chamada ${chamada?.chamada ?? ''}`"
        class="max-h-[70vh] max-w-full object-contain"
      >

      <button
        v-if="totalImagens > 1"
        type="button"
        aria-label="Próxima imagem"
        class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        @click="proxima"
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </div>

    <div v-if="totalImagens > 1" class="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
      <button
        v-for="(imagem, indice) in chamada?.imagens ?? []"
        :key="`thumb-${indice}-${imagem.slice(0, 24)}`"
        type="button"
        :aria-label="`Ver imagem ${indice + 1}`"
        :aria-current="indice === indiceImagem ? 'true' : undefined"
        class="shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        :class="indice === indiceImagem ? 'border-brand-focus' : 'border-transparent opacity-70 hover:opacity-100'"
        @click="indiceImagem = indice"
      >
        <img :src="urlMiniatura(imagem)" :alt="`Miniatura ${indice + 1}`" class="h-14 w-20 object-cover" loading="lazy" decoding="async">
      </button>
    </div>

    <template #footer>
      <UiButton variant="primary" @click="galeriaAberta = false">Fechar</UiButton>
    </template>
  </UiModal>
</template>
