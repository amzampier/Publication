<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Building2,
  ClipboardList,
  FileText,
  GitBranch,
  History,
  ImagePlus,
  Workflow
} from '@lucide/vue'
import { useEsteiraRevisaoModelo } from './useEsteiraRevisaoModelo'
import {
  VARIANTE_STATUS_CHAMADA,
  formatarData,
  formatarDataHora,
  type ItemEsteira
} from './validadores'

interface Props {
  modelValue: boolean
  item?: ItemEsteira | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { historico, historicoCarregando, carregarHistorico } = useEsteiraRevisaoModelo()

const subtitulo = computed(() =>
  props.item ? `${props.item.chamada} — ${props.item.titulo}` : ''
)

const vinculos = computed(() => {
  if (!props.item) return []
  return [
    { rotulo: 'Release Week', contexto: props.item.contexto.release },
    { rotulo: 'Manual', contexto: props.item.contexto.manual },
    { rotulo: 'Escopo de Projetos', contexto: props.item.contexto.projeto }
  ]
})

const listaHistorico = computed(() => (props.item ? historico.value[props.item.id] ?? [] : []))
const carregandoHistorico = computed(() =>
  props.item ? historicoCarregando.value[props.item.id] === true : false
)

watch(
  () => [props.modelValue, props.item?.id] as const,
  ([aberto, id]) => {
    if (aberto && id) void carregarHistorico(String(id))
  },
  { immediate: true }
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="xl"
    title="Detalhes da chamada"
    :subtitle="subtitulo"
    :icon="Workflow"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="item" class="grid gap-4">
      <UiModalSection title="Identificação" :icon="ClipboardList">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Chamada</p>
            <p class="mt-1 font-mono text-sm font-medium tabular-nums text-slate-900">
              {{ item.chamada }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[11px] font-medium text-slate-500">Título</p>
            <p class="mt-1 text-sm font-medium text-slate-900">{{ item.titulo }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Status</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <UiBadge
                :variant="VARIANTE_STATUS_CHAMADA[item.status]"
                size="sm"
                :show-icon="false"
              >
                {{ item.status }}
              </UiBadge>
              <UiBadge variant="neutral" size="sm" :show-icon="false">
                {{ item.origem }}
              </UiBadge>
            </div>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Lançamento</p>
            <p class="mt-1 font-mono text-xs tabular-nums text-slate-800">
              {{ formatarData(item.dataLancamento) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Liberação</p>
            <p class="mt-1 font-mono text-xs tabular-nums text-slate-800">
              {{ formatarData(item.dataLiberacao) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Autor</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.autorNome || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Revisor</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.revisorNome || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Última decisão</p>
            <p class="mt-1 text-xs text-slate-800">
              {{ item.dataDecisao ? formatarDataHora(item.dataDecisao) : '—' }}
            </p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Vínculos" :icon="GitBranch">
        <div class="grid gap-3 sm:grid-cols-3">
          <div
            v-for="vinculo in vinculos"
            :key="vinculo.rotulo"
            class="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {{ vinculo.rotulo }}
            </p>
            <template v-if="vinculo.contexto">
              <p class="mt-1 font-mono text-[11px] font-semibold text-slate-700">
                {{ vinculo.contexto.codigo }}
              </p>
              <p class="mt-0.5 text-xs text-slate-800">{{ vinculo.contexto.nome }}</p>
              <div class="mt-1.5">
                <UiBadge variant="neutral" size="sm" :show-icon="false">
                  {{ vinculo.contexto.status }}
                </UiBadge>
              </div>
            </template>
            <p v-else class="mt-1 text-xs text-slate-400">—</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Classificação" :icon="Building2">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Parceiro</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.parceiro || '—' }}</p>
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-[11px] font-medium text-slate-500">Softwares</p>
            <div v-if="item.softwares.length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="software in item.softwares"
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
            <p class="mt-1 text-xs text-slate-800">{{ item.modulo || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Menu / funcionalidade</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.menuFuncionalidade || '—' }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Tipo</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.tipo }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Impacto</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.impacto }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Situação</p>
            <p class="mt-1 text-xs text-slate-800">{{ item.situacao }}</p>
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <p class="text-[11px] font-medium text-slate-500">Tags</p>
            <div v-if="item.tags.length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="tag in item.tags"
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
          <p class="text-[11px] font-medium text-slate-500">Descrição completa</p>
          <div class="mt-1">
            <UiRichTextViewer :html="item.descricaoHtml" :text="item.descricaoCompleta" />
          </div>
        </div>
        <div>
          <p class="text-[11px] font-medium text-slate-500">Solução</p>
          <div class="mt-1">
            <UiRichTextViewer :html="item.solucaoHtml" :text="item.solucao" />
          </div>
        </div>
        <div>
          <p class="text-[11px] font-medium text-slate-500">Título do manual</p>
          <p class="mt-1 text-xs text-slate-800">{{ item.manualTitulo || '—' }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Link do manual</p>
            <a
              v-if="item.linkManual"
              :href="item.linkManual"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block truncate text-xs text-brand-structure underline underline-offset-2 hover:text-brand-focus"
            >
              {{ item.linkManual }}
            </a>
            <p v-else class="mt-1 text-xs text-slate-500">—</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Link do vídeo</p>
            <a
              v-if="item.linkVideo"
              :href="item.linkVideo"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block truncate text-xs text-brand-structure underline underline-offset-2 hover:text-brand-focus"
            >
              {{ item.linkVideo }}
            </a>
            <p v-else class="mt-1 text-xs text-slate-500">—</p>
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Imagens" :icon="ImagePlus">
        <div v-if="item.imagens.length" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            v-for="(imagem, indice) in item.imagens"
            :key="`${indice}-${imagem.slice(0, 24)}`"
            :href="imagem"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            :aria-label="`Abrir imagem ${indice + 1} de ${item.imagens.length}`"
          >
            <img
              :src="imagem"
              :alt="`Imagem de evidência ${indice + 1}`"
              class="h-24 w-full object-cover transition-transform group-hover:scale-105"
            >
          </a>
        </div>
        <p v-else class="flex items-center gap-1.5 text-xs text-slate-500">
          <ImagePlus class="h-3.5 w-3.5" aria-hidden="true" />
          Nenhuma imagem anexada.
        </p>
      </UiModalSection>

      <UiModalSection title="Histórico da esteira" :icon="History">
        <EsteiraHistorico
          :historico="listaHistorico"
          :carregando="carregandoHistorico"
        />
      </UiModalSection>

      <UiModalSection title="Informações de cadastro" :icon="ClipboardList">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-[11px] font-medium text-slate-500">Criado em</p>
            <p class="mt-1 text-xs text-slate-800">{{ formatarDataHora(item.criadoEm) }}</p>
          </div>
          <div>
            <p class="text-[11px] font-medium text-slate-500">Atualizado em</p>
            <p class="mt-1 text-xs text-slate-800">{{ formatarDataHora(item.atualizadoEm) }}</p>
          </div>
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="primary" @click="emit('update:modelValue', false)">Fechar</UiButton>
    </template>
  </UiModal>
</template>
