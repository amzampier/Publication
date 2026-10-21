<script setup lang="ts">
import { computed } from 'vue'
import {
  Building2,
  ClipboardList,
  Eye,
  FileText,
  ImagePlus,
  Link2,
  Megaphone,
  Tags
} from '@lucide/vue'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import {
  VARIANTE_STATUS_CHAMADA,
  formatarData,
  formatarDataHora,
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
    { rotulo: 'Release', valor: rotulo(catalogo.releases, chamada.releaseId) },
    { rotulo: 'Projeto', valor: rotulo(catalogo.projetos, chamada.projetoId) },
    { rotulo: 'Manual', valor: rotulo(catalogo.manuais, chamada.manualId) }
  ].filter((vinculo) => vinculo.valor)
})
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
            <p class="text-[11px] font-medium text-slate-500">Software</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.software || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Parceiro</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.parceiro || '—' }}</p>
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
          <div>
            <p class="text-[11px] font-medium text-slate-500">Situação</p>
            <p class="mt-1 text-xs text-slate-800">{{ chamada.situacao }}</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Vínculos" :icon="Link2">
        <div v-if="vinculos.length" class="grid gap-4 sm:grid-cols-3">
          <div v-for="vinculo in vinculos" :key="vinculo.rotulo">
            <p class="text-[11px] font-medium text-slate-500">{{ vinculo.rotulo }}</p>
            <p class="mt-1 text-xs text-slate-800">{{ vinculo.valor }}</p>
          </div>
        </div>
        <p v-else class="text-xs text-slate-500">Nenhum vínculo informado.</p>
      </UiModalSection>

      <UiModalSection title="Conteúdo" :icon="FileText">
        <div>
          <p class="text-[11px] font-medium text-slate-500">Descrição completa</p>
          <p class="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-800">
            {{ chamada.descricaoCompleta || '—' }}
          </p>
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

      <UiModalSection title="Tags e imagens" :icon="Tags">
        <div>
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

        <div>
          <p class="text-[11px] font-medium text-slate-500">Imagens</p>
          <div v-if="chamada.imagens.length" class="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a
              v-for="(imagem, indice) in chamada.imagens"
              :key="`${indice}-${imagem.slice(0, 24)}`"
              :href="imagem"
              target="_blank"
              rel="noopener noreferrer"
              class="overflow-hidden rounded-lg border border-slate-200"
            >
              <img
                :src="imagem"
                :alt="`Imagem de evidência ${indice + 1}`"
                class="h-24 w-full object-cover transition-transform hover:scale-105"
              >
            </a>
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
      <UiButton variant="outline" @click="emit('update:modelValue', false)">Fechar</UiButton>
    </template>
  </UiModal>
</template>
