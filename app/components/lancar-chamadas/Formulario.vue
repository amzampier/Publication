<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  Building2,
  ClipboardList,
  FileText,
  Info,
  Link2,
  Megaphone,
  Save,
  ShieldCheck
} from '@lucide/vue'
import type { SegmentedOption } from '../ui/Segmented.vue'
import { useToast } from '../../composables/useToast'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import {
  IMPACTOS_CHAMADA,
  MAX_TAGS_CHAMADA,
  MAX_TAG_CHAMADA,
  TIPOS_CHAMADA,
  derivarOrigem,
  formatarDataHora,
  proximaSegunda,
  validarChamada,
  type CampoChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type ImpactoChamada,
  type SituacaoChamada,
  type TipoChamada
} from './validadores'

interface Props {
  modelValue: boolean
  modo: 'novo' | 'editar'
  chamada?: ChamadaModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  chamada: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { adicionar, atualizar, chamadas, catalogo, autorAtual } = useLancarChamadasModelo()

const etapas = [
  {
    titulo: 'Vínculos e origem',
    descricao: 'Onde a chamada será vinculada',
    icone: Link2
  },
  {
    titulo: 'Identificação',
    descricao: 'Número, título e datas',
    icone: ClipboardList
  },
  {
    titulo: 'Classificação',
    descricao: 'Software, parceiro, atributos e tags',
    icone: Building2
  },
  {
    titulo: 'Conteúdo e mídias',
    descricao: 'Descrição, manual, links e imagens',
    icone: FileText
  }
]

const camposPorEtapa: CampoChamada[][] = [
  ['vinculo'],
  ['chamada', 'titulo', 'dataLancamento', 'dataLiberacao'],
  ['softwareId', 'parceiroId', 'modulo', 'tipo', 'impacto', 'tags'],
  ['descricaoCompleta', 'manualTitulo', 'linkManual', 'linkVideo']
]

const etapa = ref(0)

interface Rascunho {
  chamada: string
  titulo: string
  dataLancamento: string
  dataLiberacao: string
  releaseId: string
  projetoId: string
  manualId: string
  softwareId: string
  parceiroId: string
  modulo: string
  menuFuncionalidade: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  situacao: SituacaoChamada
  descricaoCompleta: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  tags: string[]
}

const rascunhoVazio = (): Rascunho => ({
  chamada: '',
  titulo: '',
  dataLancamento: proximaSegunda(),
  dataLiberacao: '',
  releaseId: '',
  projetoId: '',
  manualId: '',
  softwareId: '',
  parceiroId: '',
  modulo: '',
  menuFuncionalidade: '',
  tipo: 'Correção',
  impacto: 'Médio',
  situacao: 'Desenvolvimento',
  descricaoCompleta: '',
  manualTitulo: '',
  linkManual: '',
  linkVideo: '',
  imagens: [],
  tags: [],
})

const deChamada = (chamada: ChamadaModelo): Rascunho => ({
  chamada: chamada.chamada,
  titulo: chamada.titulo,
  dataLancamento: chamada.dataLancamento,
  dataLiberacao: chamada.dataLiberacao,
  releaseId: chamada.releaseId,
  projetoId: chamada.projetoId,
  manualId: chamada.manualId,
  softwareId: chamada.softwareId,
  parceiroId: chamada.parceiroId,
  modulo: chamada.modulo,
  menuFuncionalidade: chamada.menuFuncionalidade,
  tipo: chamada.tipo,
  impacto: chamada.impacto,
  situacao: chamada.situacao,
  descricaoCompleta: chamada.descricaoCompleta,
  manualTitulo: chamada.manualTitulo,
  linkManual: chamada.linkManual,
  linkVideo: chamada.linkVideo,
  imagens: [...chamada.imagens],
  tags: [...chamada.tags],
})

const rascunho = ref<Rascunho>(rascunhoVazio())
const erros = ref<Partial<Record<CampoChamada, string>>>({})

const titulo = computed(() => (props.modo === 'editar' ? 'Editar Chamada' : 'Nova Chamada'))
const etapaAtual = computed(() => etapas[etapa.value] ?? etapas[0]!)
const subtitulo = computed(
  () => `Etapa ${etapa.value + 1} de ${etapas.length} — ${etapaAtual.value.titulo}`
)

const statusAtual = computed(() =>
  props.modo === 'editar' && props.chamada ? props.chamada.status : 'Revisar'
)

const autorExibicao = computed(() =>
  props.modo === 'editar' && props.chamada ? props.chamada.autorNome : autorAtual.value.nome
)

const origemDerivada = computed(() => derivarOrigem(rascunho.value))

const opcoesRelease = computed(() =>
  catalogo.releases.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)
const opcoesProjeto = computed(() =>
  catalogo.projetos.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)
const opcoesManual = computed(() =>
  catalogo.manuais.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)
const opcoesSoftware = computed(() =>
  catalogo.softwares.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)
const opcoesParceiro = computed(() =>
  catalogo.parceiros.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)

const opcoesTipo: SegmentedOption[] = TIPOS_CHAMADA.map((tipo) => ({
  value: tipo,
  label: tipo,
  tone: tipo === 'Correção' ? 'rose' : tipo === 'Melhoria' ? 'sky' : 'emerald'
}))
const opcoesImpacto: SegmentedOption[] = IMPACTOS_CHAMADA.map((impacto) => ({
  value: impacto,
  label: impacto,
  tone:
    impacto === 'Baixo'
      ? 'slate'
      : impacto === 'Médio'
        ? 'sky'
        : impacto === 'Alto'
          ? 'indigo'
          : 'rose'
}))

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

const definirData = (campo: 'dataLancamento' | 'dataLiberacao', data: Date | null) => {
  rascunho.value[campo] = paraIso(data)
}

const selecionarRelease = (valor: string) => {
  rascunho.value.releaseId = valor
  const release = catalogo.releases.find((opcao) => opcao.id === valor)
  if (release?.dataPublicacao) {
    rascunho.value.dataLiberacao = release.dataPublicacao
  }
}

const focarCampo = (campo: string) => {
  nextTick(() => {
    const wrapper = document.querySelector<HTMLElement>(`[data-campo="${campo}"]`)
    const alvo = wrapper?.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), [role="combobox"], [role="radio"][tabindex="0"]'
    )
    alvo?.focus()
  })
}

const irParaEtapa = (indice: number) => {
  etapa.value = Math.min(Math.max(indice, 0), etapas.length - 1)
  nextTick(() => {
    document.querySelector<HTMLElement>('.fp-modal-body')?.scrollTo({ top: 0 })
  })
}

const validar = (): ReturnType<typeof validarChamada> => {
  const resultado = validarChamada(
    {
      ...rascunho.value,
    },
    chamadas.value,
    props.chamada?.id
  )
  erros.value = resultado.erros
  return resultado
}

const avancar = () => {
  const resultado = validar()
  const campo = camposPorEtapa[etapa.value]?.find((item) => erros.value[item])
  if (campo) {
    focarCampo(campo)
    return
  }
  if (resultado.primeiroErro && etapa.value === etapas.length - 1) {
    focarCampo(resultado.primeiroErro)
    return
  }
  irParaEtapa(Math.min(etapa.value + 1, etapas.length - 1))
}

const voltar = () => {
  irParaEtapa(Math.max(0, etapa.value - 1))
}

const salvar = () => {
  const resultado = validar()
  if (resultado.primeiroErro) {
    const indice = camposPorEtapa.findIndex((campos) =>
      campos.includes(resultado.primeiroErro as CampoChamada)
    )
    if (indice >= 0 && indice !== etapa.value) irParaEtapa(indice)
    focarCampo(resultado.primeiroErro)
    return
  }

  const entrada: EntradaChamada = {
    chamada: rascunho.value.chamada.trim(),
    titulo: rascunho.value.titulo.trim(),
    dataLancamento: rascunho.value.dataLancamento,
    dataLiberacao: rascunho.value.dataLiberacao,
    releaseId: rascunho.value.releaseId,
    projetoId: rascunho.value.projetoId,
    manualId: rascunho.value.manualId,
    softwareId: rascunho.value.softwareId,
    parceiroId: rascunho.value.parceiroId,
    modulo: rascunho.value.modulo.trim(),
    menuFuncionalidade: rascunho.value.menuFuncionalidade.trim(),
    tipo: rascunho.value.tipo,
    impacto: rascunho.value.impacto,
    situacao: rascunho.value.situacao,
    descricaoCompleta: rascunho.value.descricaoCompleta.trim(),
    manualTitulo: rascunho.value.manualTitulo.trim(),
    linkManual: rascunho.value.linkManual.trim(),
    linkVideo: rascunho.value.linkVideo.trim(),
    imagens: [...rascunho.value.imagens],
    tags: rascunho.value.tags.map((tag) => tag.trim()).filter(Boolean),
  }

  if (props.modo === 'editar' && props.chamada) {
    atualizar(props.chamada.id, entrada)
    toast.success('Lançar as Chamadas', 'Chamada atualizada com sucesso.')
  } else {
    adicionar(entrada)
    toast.success('Lançar as Chamadas', 'Chamada incluída com sucesso.')
  }
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) return
    erros.value = {}
    etapa.value = 0
    rascunho.value =
      props.modo === 'editar' && props.chamada ? deChamada(props.chamada) : rascunhoVazio()
  }
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="xl"
    :title="titulo"
    :subtitle="subtitulo"
    :icon="Megaphone"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <ol class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Etapas da chamada">
        <li v-for="(item, indice) in etapas" :key="item.titulo">
          <button
            type="button"
            :aria-current="indice === etapa ? 'step' : undefined"
            :class="[
              'flex h-full w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
              indice === etapa
                ? 'border-brand-focus bg-lime-50 text-lime-900'
                : indice < etapa
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-focus'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-brand-focus hover:text-slate-700'
            ]"
            @click="irParaEtapa(indice)"
          >
            <span
              :class="[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                indice === etapa
                  ? 'bg-brand-focus text-white'
                  : indice < etapa
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-500'
              ]"
            >
              <ShieldCheck v-if="indice < etapa" class="h-3.5 w-3.5" aria-hidden="true" />
              <span v-else>{{ indice + 1 }}</span>
            </span>
            <span class="min-w-0">
              <span class="block truncate text-[11px] font-semibold">{{ item.titulo }}</span>
              <span class="block truncate text-[10px] text-slate-500">{{ item.descricao }}</span>
            </span>
          </button>
        </li>
      </ol>

      <UiModalSection
        v-if="etapa === 0"
        title="Vínculos e origem"
        :icon="Link2"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <div data-campo="vinculo">
            <UiSelect
              :model-value="rascunho.releaseId"
              label="Release"
              placeholder="Nenhuma release"
              :options="opcoesRelease"
              :error="erros.vinculo"
              @update:model-value="selecionarRelease(String($event))"
            />
          </div>
          <div>
            <UiSelect
              :model-value="rascunho.projetoId"
              label="Projeto"
              placeholder="Nenhum projeto"
              :options="opcoesProjeto"
              @update:model-value="rascunho.projetoId = String($event)"
            />
          </div>
          <div>
            <UiSelect
              :model-value="rascunho.manualId"
              label="Manual"
              placeholder="Nenhum manual"
              :options="opcoesManual"
              @update:model-value="rascunho.manualId = String($event)"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-slate-700">Origem derivada</span>
            <div class="flex h-[34px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <UiBadge variant="neutral" size="sm">
                {{ origemDerivada ?? 'Sem vínculo' }}
              </UiBadge>
              <span class="text-[10px] text-slate-500">Calculada pelos vínculos</span>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-500">
          Informe ao menos um vínculo: Release, Projeto ou Manual. Dois ou mais vínculos resultam em
          <span class="font-medium">Ambos</span>.
        </p>
      </UiModalSection>

      <UiModalSection
        v-else-if="etapa === 1"
        title="Identificação"
        :icon="ClipboardList"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <UiInput
            v-model="rascunho.chamada"
            data-campo="chamada"
            label="Chamada"
            mono
            placeholder="0000578990 ou CH-2026-8941"
            :error="erros.chamada"
          />
          <UiInput
            v-model="rascunho.titulo"
            data-campo="titulo"
            label="Título"
            placeholder="Título resumido da melhoria, correção ou procedimento"
            :error="erros.titulo"
          />
          <div data-campo="dataLancamento">
            <UiDatePicker
              :model-value="paraData(rascunho.dataLancamento)"
              label="Data de lançamento"
              helper-text="Sempre segunda-feira."
              :error="erros.dataLancamento"
              @update:model-value="definirData('dataLancamento', $event)"
            />
          </div>
          <div data-campo="dataLiberacao">
            <UiDatePicker
              :model-value="paraData(rascunho.dataLiberacao)"
              label="Data de liberação"
              helper-text="Preenchida pela publicação da Release vinculada; se necessário, ajuste."
              :error="erros.dataLiberacao"
              @update:model-value="definirData('dataLiberacao', $event)"
            />
          </div>
          <UiInput label="Status" :model-value="statusAtual" disabled />
          <UiInput label="Autor" :model-value="autorExibicao" disabled />
        </div>
      </UiModalSection>

      <UiModalSection
        v-else-if="etapa === 2"
        title="Classificação"
        :icon="Building2"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <div data-campo="softwareId">
            <UiSelect
              :model-value="rascunho.softwareId"
              label="Software"
              placeholder="Selecione o software"
              :options="opcoesSoftware"
              :error="erros.softwareId"
              @update:model-value="rascunho.softwareId = String($event)"
            />
          </div>
          <div data-campo="parceiroId">
            <UiSelect
              :model-value="rascunho.parceiroId"
              label="Parceiro"
              placeholder="Selecione o parceiro"
              :options="opcoesParceiro"
              :error="erros.parceiroId"
              @update:model-value="rascunho.parceiroId = String($event)"
            />
          </div>
          <UiInput
            v-model="rascunho.modulo"
            data-campo="modulo"
            label="Módulo"
            placeholder="Ex.: Fiscal, Financeiro, WMS"
            :error="erros.modulo"
          />
          <UiInput
            v-model="rascunho.menuFuncionalidade"
            label="Menu / funcionalidade"
            placeholder="Ex.: Notas fiscais, Expedição"
          />
          <UiSegmented
            :model-value="rascunho.tipo"
            data-campo="tipo"
            label="Tipo"
            :options="opcoesTipo"
            :error="erros.tipo"
            @update:model-value="rascunho.tipo = $event as TipoChamada"
          />
          <UiSegmented
            :model-value="rascunho.impacto"
            data-campo="impacto"
            label="Impacto"
            :options="opcoesImpacto"
            :error="erros.impacto"
            @update:model-value="rascunho.impacto = $event as ImpactoChamada"
          />
          <div data-campo="tags" class="sm:col-span-2">
            <UiTagInput
              v-model="rascunho.tags"
              label="Tags"
              :max="MAX_TAGS_CHAMADA"
              :max-length="MAX_TAG_CHAMADA"
              :error="erros.tags"
              helper-text="Até 12 tags, com 30 caracteres cada."
            />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection
        v-else
        title="Conteúdo e mídias"
        :icon="FileText"
      >
        <UiTextarea
          v-model="rascunho.descricaoCompleta"
          data-campo="descricaoCompleta"
          label="Descrição completa"
          placeholder="Detalhamento do impacto, causas, manual e validação"
          :rows="4"
          :error="erros.descricaoCompleta"
        />

        <LancarChamadasMidias
          v-model:imagens="rascunho.imagens"
          v-model:manual-titulo="rascunho.manualTitulo"
          v-model:link-manual="rascunho.linkManual"
          v-model:link-video="rascunho.linkVideo"
          :erro-manual-titulo="erros.manualTitulo"
          :erro-link-manual="erros.linkManual"
          :erro-link-video="erros.linkVideo"
        />

        <UiModalSection
          v-if="modo === 'editar' && chamada"
          title="Informações de Cadastro"
          :icon="Info"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput label="Criado em" :model-value="formatarDataHora(chamada.criadoEm)" disabled />
            <UiInput
              label="Atualizado em"
              :model-value="formatarDataHora(chamada.atualizadoEm)"
              disabled
            />
          </div>
        </UiModalSection>
      </UiModalSection>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2.5">
        <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
        <div class="flex items-center gap-2.5">
          <UiButton v-if="etapa > 0" variant="outline" @click="voltar">Anterior</UiButton>
          <UiButton v-if="etapa < etapas.length - 1" variant="primary" @click="avancar">
            Próximo
          </UiButton>
          <UiButton v-else variant="primary" @click="salvar">
            <template #leftIcon><Save class="h-4 w-4" /></template>
            Salvar Chamada
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
