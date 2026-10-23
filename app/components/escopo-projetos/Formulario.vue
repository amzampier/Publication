<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { ClipboardList, CalendarDays, Boxes, Clock } from '@lucide/vue'
import type { SegmentedOption } from '../ui/Segmented.vue'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import {
  formatarDataHora,
  validarEscopo,
  useEscopoProjetosModelo,
  type CampoEscopo,
  type ProjetoEscopoModelo,
  type StatusEscopo
} from './useEscopoProjetosModelo'

interface Props {
  modelValue: boolean
  modo: 'novo' | 'editar'
  escopo?: ProjetoEscopoModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  escopo: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const salvando = ref(false)
const { can } = usePermissions()
const { escopos, adicionar, atualizar } = useEscopoProjetosModelo()

interface Rascunho {
  codigo: string
  nome: string
  versao: string
  ano: string
  dataInicio: string
  dataFinal: string
  dataPrevisao: string
  dataPublicacao: string
  status: StatusEscopo
  descricaoGeral: string
  criadoEm: string
  atualizadoEm: string
}

const rascunhoVazio = (): Rascunho => ({
  codigo: '',
  nome: '',
  versao: '',
  ano: String(new Date().getFullYear()),
  dataInicio: '',
  dataFinal: '',
  dataPrevisao: '',
  dataPublicacao: '',
  status: 'Em Andamento',
  descricaoGeral: '',
  criadoEm: '',
  atualizadoEm: ''
})

const rascunho = ref<Rascunho>(rascunhoVazio())
const erros = ref<Partial<Record<CampoEscopo, string>>>({})

const titulo = computed(() => (props.modo === 'editar' ? 'Editar Escopo' : 'Novo Escopo'))

const statusOpcoes = computed<SegmentedOption[]>(() => {
  const opcoes: SegmentedOption[] = [
    { value: 'Em Andamento', label: 'Em Andamento', tone: 'sky' },
    { value: 'Homologação', label: 'Homologação', tone: 'indigo' },
    { value: 'Concluído', label: 'Concluído', tone: 'emerald' }
  ]
  // Publicar é uma ação própria: sem a permissão, a opção só aparece para
  // exibir o status atual de um registro já publicado (somente leitura).
  if (can('escopo-projetos', 'publicar') || rascunho.value.status === 'Publicado') {
    opcoes.push({ value: 'Publicado', label: 'Publicado', tone: 'navy' })
  }
  return opcoes
})

// Softwares contemplados NÃO são escolhidos no formulário: a API devolve os
// nomes das chamadas e eles só aparecem quando existir pelo menos um item.
const softwaresContemplados = computed(() => props.escopo?.softwaresContemplados ?? [])

const paraIso = (data: Date | null): string => {
  if (!data) return ''
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const paraData = (iso: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

const definirData = (
  campo: 'dataInicio' | 'dataFinal' | 'dataPrevisao' | 'dataPublicacao',
  data: Date | null
) => {
  rascunho.value[campo] = paraIso(data)
}

const criadoTexto = computed(() => formatarDataHora(rascunho.value.criadoEm))
const atualizadoTexto = computed(() => formatarDataHora(rascunho.value.atualizadoEm))

const focarCampo = (campo: string) => {
  nextTick(() => {
    const wrapper = document.querySelector<HTMLElement>(`[data-campo="${campo}"]`)
    const alvo = wrapper?.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), [role="combobox"], [role="radio"][tabindex="0"], button:not([disabled])'
    )
    alvo?.focus()
  })
}

const validar = (): boolean => {
  const resultado = validarEscopo(rascunho.value, escopos.value, props.escopo?.id)
  erros.value = resultado.erros
  if (resultado.primeiroErro) {
    focarCampo(resultado.primeiroErro)
    return false
  }
  return true
}

const salvar = async () => {
  if (salvando.value) return
  if (!validar()) return
  const dados = {
    nome: rascunho.value.nome,
    versao: rascunho.value.versao,
    ano: Number(rascunho.value.ano),
    dataInicio: rascunho.value.dataInicio,
    dataFinal: rascunho.value.dataFinal,
    dataPrevisao: rascunho.value.dataPrevisao,
    dataPublicacao: rascunho.value.dataPublicacao,
    status: rascunho.value.status,
    descricaoGeral: rascunho.value.descricaoGeral
  }

  salvando.value = true
  try {
    if (props.modo === 'editar' && props.escopo) {
      await atualizar(props.escopo.id, dados)
      toast.success('Escopo de Projetos', 'Escopo atualizado com sucesso.')
    } else {
      await adicionar(dados)
      toast.success('Escopo de Projetos', 'Escopo incluído com sucesso.')
    }
    emit('update:modelValue', false)
  } catch (erro) {
    const e = erro as {
      statusMessage?: string
      data?: {
        statusMessage?: string
        erros?: Partial<Record<CampoEscopo, string>>
      }
    } | null
    const errosApi = e?.data?.erros
    if (errosApi && Object.keys(errosApi).length) {
      erros.value = errosApi
      const primeiro = Object.keys(errosApi)[0]
      if (primeiro) focarCampo(primeiro)
      return
    }
    toast.danger(
      'Escopo de Projetos',
      e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível salvar o escopo.'
    )
  } finally {
    salvando.value = false
  }
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: edição copia o registro; criação começa com os padrões.
watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) return
    erros.value = {}
    if (props.modo === 'editar' && props.escopo) {
      const e = props.escopo
      rascunho.value = {
        codigo: e.codigo,
        nome: e.nome,
        versao: e.versao,
        ano: String(e.ano),
        dataInicio: e.dataInicio,
        dataFinal: e.dataFinal,
        dataPrevisao: e.dataPrevisao,
        dataPublicacao: e.dataPublicacao,
        status: e.status,
        descricaoGeral: e.descricaoGeral,
        criadoEm: e.criadoEm,
        atualizadoEm: e.atualizadoEm
      }
    } else {
      rascunho.value = rascunhoVazio()
    }
  },
  { immediate: true }
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="titulo"
    subtitle="Dados do escopo anual e softwares contemplados"
    :icon="ClipboardList"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]">
      <UiModalSection title="Dados do Escopo" :icon="ClipboardList" class="[&>div.grid]:gap-y-[11px]">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <div class="flex flex-col gap-[11px] sm:col-span-6 sm:flex-row sm:gap-4">
            <div v-if="modo === 'editar'" class="sm:w-[8.5rem] sm:shrink-0">
              <UiInput label="Código" :model-value="rascunho.codigo" disabled mono />
            </div>
            <UiInput
              v-model="rascunho.nome"
              data-campo="nome"
              class="flex-1"
              label="Nome"
              placeholder="Ex.: Escopo Anual 2026"
              :error="erros.nome"
            />
          </div>

          <UiInput
            v-model="rascunho.versao"
            data-campo="versao"
            class="sm:col-span-3"
            label="Versão"
            placeholder="Ex.: v2026.1"
            :error="erros.versao"
          />
          <UiInput
            v-model="rascunho.ano"
            data-campo="ano"
            class="sm:col-span-3"
            type="number"
            label="Ano"
            placeholder="2026"
            :error="erros.ano"
          />

          <UiSegmented
            :model-value="rascunho.status"
            data-campo="status"
            class="sm:col-span-6"
            label="Status"
            :options="statusOpcoes"
            :error="erros.status"
            @update:model-value="rascunho.status = $event as StatusEscopo"
          />
        </div>
      </UiModalSection>

      <UiModalSection title="Cronograma" :icon="CalendarDays">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <div data-campo="dataInicio">
            <UiDatePicker
              :model-value="paraData(rascunho.dataInicio)"
              label="Data de Início"
              :error="erros.dataInicio"
              @update:model-value="definirData('dataInicio', $event)"
            />
          </div>
          <div data-campo="dataFinal">
            <UiDatePicker
              :model-value="paraData(rascunho.dataFinal)"
              label="Data Final"
              :error="erros.dataFinal"
              @update:model-value="definirData('dataFinal', $event)"
            />
          </div>
          <div data-campo="dataPrevisao">
            <UiDatePicker
              :model-value="paraData(rascunho.dataPrevisao)"
              label="Data de Previsão"
              :error="erros.dataPrevisao"
              @update:model-value="definirData('dataPrevisao', $event)"
            />
          </div>
          <div data-campo="dataPublicacao">
            <UiDatePicker
              :model-value="paraData(rascunho.dataPublicacao)"
              label="Data de Publicação"
              :error="erros.dataPublicacao"
              @update:model-value="definirData('dataPublicacao', $event)"
            />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection
        :title="softwaresContemplados.length ? 'Softwares e Descrição' : 'Descrição'"
        :icon="Boxes"
      >
        <div class="grid gap-y-[11px]">
          <div v-if="softwaresContemplados.length">
            <p class="text-xs font-medium text-slate-700">Softwares contemplados</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <UiBadge
                v-for="software in softwaresContemplados"
                :key="software"
                variant="neutral"
                size="sm"
              >
                {{ software }}
              </UiBadge>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Preenchido automaticamente pelos itens lançados no escopo.
            </p>
          </div>
          <p v-else class="text-xs text-slate-500">
            Os softwares contemplados serão preenchidos automaticamente quando os itens forem
            lançados no escopo.
          </p>

          <UiTextarea
            v-model="rascunho.descricaoGeral"
            label="Descrição Geral"
            placeholder="Visão geral e objetivos de negócio do escopo"
            :rows="4"
          />
        </div>
      </UiModalSection>

      <UiModalSection v-if="modo === 'editar'" title="Informações de Cadastro" :icon="Clock">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <UiInput label="Criado em" :model-value="criadoTexto" disabled />
          <UiInput label="Atualizado em" :model-value="atualizadoTexto" disabled />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>
</template>
