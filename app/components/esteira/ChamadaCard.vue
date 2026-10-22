<script setup lang="ts">
import { computed } from 'vue'
import {
  ArchiveRestore,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  Undo2,
  UploadCloud,
  XCircle
} from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import { itemVisivelNoPortal } from './validadores'
import type { LinhaEsteira } from './useEsteiraRevisaoModelo'

interface Props {
  linha: LinhaEsteira
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'detalhes', linha: LinhaEsteira): void
  (e: 'aprovar', linha: LinhaEsteira): void
  (e: 'recusar', linha: LinhaEsteira): void
  (e: 'reabrir', linha: LinhaEsteira): void
  (e: 'publicar', linha: LinhaEsteira): void
  (e: 'suspender', linha: LinhaEsteira): void
}>()

const { can } = usePermissions()

const rotuloOrigem = computed(() => {
  if (props.linha.origem === 'Release') return 'Release Week'
  if (props.linha.origem === 'Manual') return 'Manual'
  if (props.linha.origem === 'Projeto') return 'Escopo'
  if (props.linha.origem === 'Ambos') return 'Ambos'
  return 'Sem vínculo'
})

const tagsVisiveis = computed(() => props.linha.item.tags.slice(0, 3))
const tagsRestantes = computed(() => Math.max(0, props.linha.item.tags.length - 3))
const imagens = computed(() => props.linha.item.imagens.length)
const visivelNoPortal = computed(() => itemVisivelNoPortal(props.linha.item))

const abrirPortal = () => {
  if (!visivelNoPortal.value) return
  window.open('/', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <article
    class="group flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-colors hover:border-slate-300"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-1.5">
        <UiBadge variant="neutral" size="sm" :show-icon="false">
          {{ rotuloOrigem }}
        </UiBadge>
        <span class="truncate font-mono text-[10px] text-slate-400">{{ linha.vinculo }}</span>
      </div>
      <UiTooltip v-if="imagens" :content="`${imagens} imagem(ns) de evidência`" position="top">
        <span class="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
          <ImageIcon class="h-3 w-3" aria-hidden="true" />
          {{ imagens }}
        </span>
      </UiTooltip>
    </div>

    <p class="mt-2 font-mono text-xs font-semibold tabular-nums text-slate-700">
      {{ linha.chamada }}
    </p>

    <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-500">
      <span>{{ linha.software || '—' }}</span>
      <span class="text-slate-300">·</span>
      <span>{{ linha.item.parceiro || '—' }}</span>
    </div>

    <h3 class="mt-2 text-sm font-semibold leading-snug text-slate-900">
      {{ linha.titulo }}
    </h3>

    <p class="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
      {{ linha.item.descricaoCompleta || 'Sem descrição.' }}
    </p>

    <div v-if="tagsVisiveis.length" class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="tag in tagsVisiveis"
        :key="tag"
        class="rounded border border-lime-200 bg-lime-50 px-1.5 py-0.5 text-[10px] font-medium text-lime-900"
      >
        #{{ tag }}
      </span>
      <span
        v-if="tagsRestantes"
        class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
      >
        +{{ tagsRestantes }}
      </span>
    </div>

    <div class="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
      <template v-if="linha.status === 'Revisar'">
        <UiTooltip content="Inspecionar chamada" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-structure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Inspecionar chamada"
            @click="emit('detalhes', linha)"
          >
            <Eye class="h-4 w-4" />
          </button>
        </UiTooltip>
        <UiTooltip v-if="can('esteira-revisao', 'publicar')" content="Aprovar chamada" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Aprovar chamada"
            @click="emit('aprovar', linha)"
          >
            <ShieldCheck class="h-4 w-4" />
          </button>
        </UiTooltip>
        <UiTooltip v-if="can('esteira-revisao', 'alterar')" content="Recusar chamada" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Recusar chamada"
            @click="emit('recusar', linha)"
          >
            <XCircle class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template v-else-if="linha.status === 'Aprovado'">
        <UiTooltip v-if="can('esteira-revisao', 'alterar')" content="Voltar para revisão" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Voltar para revisão"
            @click="emit('reabrir', linha)"
          >
            <Undo2 class="h-4 w-4" />
          </button>
        </UiTooltip>
        <UiTooltip v-if="can('esteira-revisao', 'publicar')" content="Publicar item" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-brand-structure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Publicar item"
            @click="emit('publicar', linha)"
          >
            <UploadCloud class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template v-else-if="linha.status === 'Publicar'">
        <span
          v-if="!visivelNoPortal"
          class="mr-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-700"
        >
          <Clock class="h-3 w-3" aria-hidden="true" />
          Aguardando pai
        </span>
        <UiTooltip v-if="can('esteira-revisao', 'publicar')" content="Suspender para homologado" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Suspender para homologado"
            @click="emit('suspender', linha)"
          >
            <ArchiveRestore class="h-4 w-4" />
          </button>
        </UiTooltip>
        <UiTooltip
          :content="visivelNoPortal ? 'Abrir no portal público' : 'Aguardando publicação do conteúdo pai'"
          position="top"
        >
          <button
            type="button"
            :disabled="!visivelNoPortal"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-structure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            :aria-label="
              visivelNoPortal
                ? 'Abrir no portal público'
                : 'Abrir no portal público — aguardando publicação do conteúdo pai'
            "
            @click="abrirPortal"
          >
            <ExternalLink class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template v-else>
        <UiTooltip content="Inspecionar chamada" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-structure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Inspecionar chamada"
            @click="emit('detalhes', linha)"
          >
            <Eye class="h-4 w-4" />
          </button>
        </UiTooltip>
        <UiTooltip v-if="can('esteira-revisao', 'alterar')" content="Reabrir chamada" position="top">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            aria-label="Reabrir chamada"
            @click="emit('reabrir', linha)"
          >
            <Undo2 class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>
    </div>
  </article>
</template>
