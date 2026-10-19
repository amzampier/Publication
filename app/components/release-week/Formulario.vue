<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Rocket, CalendarDays, FileText, Clock } from '@lucide/vue'
import type { SegmentedOption } from '../ui/Segmented.vue'
import { useToast } from '../../composables/useToast'
import {
  MESES,
  formatarData,
  validarReleaseWeek,
  useReleaseWeekModelo,
  type CampoReleaseWeek,
  type StatusRelease,
  type ReleaseWeekModelo
} from './useReleaseWeekModelo'

interface PrefillClone {
  versao: string
  release: string
  destaqueSemana: boolean
}

interface Props {
  modelValue: boolean
  modo: 'novo' | 'editar'
  release?: ReleaseWeekModelo | null
  prefill?: PrefillClone | null
}

const props = withDefaults(defineProps<Props>(), {
  release: null,
  prefill: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { adicionar, atualizar } = useReleaseWeekModelo()

interface Rascunho {
  codigo: string
  nome: string
  versao: string
  release: string
  semana: string
  ano: string
  mes: string
  dataInicio: string
  dataFinaliza: string
  dataPublicacao: string
  status: StatusRelease
  descricao: string
  destaqueSemana: boolean
  criadoEm: string
  atualizadoEm: string
}

const rascunhoVazio = (prefill?: PrefillClone | null): Rascunho => ({
  codigo: '',
  nome: '',
  versao: prefill?.versao ?? '',
  release: prefill?.release ?? '',
  semana: '',
  ano: String(new Date().getFullYear()),
  // Nova release já abre no mês atual; a clonagem mantém o mês em branco.
  mes: prefill ? '' : (MESES[new Date().getMonth()] ?? ''),
  dataInicio: '',
  dataFinaliza: '',
  dataPublicacao: '',
  status: 'Aberta',
  descricao: '',
  destaqueSemana: prefill?.destaqueSemana ?? false,
  criadoEm: '',
  atualizadoEm: ''
})

const rascunho = ref<Rascunho>(rascunhoVazio())
const erros = ref<Partial<Record<CampoReleaseWeek, string>>>({})

const titulo = computed(() => {
  if (props.modo === 'editar') return 'Editar Release Week'
  if (props.prefill) return 'Clonar Release Week'
  return 'Nova Release Week'
})

const opcoesMes = MESES.map((mes) => ({ value: mes, label: mes }))
const statusOpcoes: SegmentedOption[] = [
  { value: 'Aberta', label: 'Aberta', tone: 'sky' },
  { value: 'Em Revisão', label: 'Em Revisão', tone: 'indigo' },
  { value: 'Aprovado', label: 'Aprovado', tone: 'emerald' },
  { value: 'Publicado', label: 'Publicado', tone: 'navy' }
]

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

const definirData = (campo: 'dataInicio' | 'dataFinaliza' | 'dataPublicacao', data: Date | null) => {
  rascunho.value[campo] = paraIso(data)
}

/** Semana aceita somente 1–52: só dígitos e clamp imediato (nunca 0/53+). */
const definirSemana = (valor: string) => {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 2)
  if (!digitos) {
    rascunho.value.semana = ''
    return
  }
  const numero = Number(digitos)
  rascunho.value.semana = String(Math.min(52, Math.max(1, numero)))
}

const formatarDataHora = (iso: string): string => {
  if (!iso) return '-'
  const data = new Date(iso)
  return Number.isNaN(data.getTime())
    ? '-'
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
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

const validar = (): boolean => {
  const resultado = validarReleaseWeek(rascunho.value)
  erros.value = resultado.erros
  if (resultado.primeiroErro) {
    focarCampo(resultado.primeiroErro)
    return false
  }
  return true
}

const salvando = ref(false)

const salvar = async () => {
  if (!validar()) return

  const dados = {
    nome: rascunho.value.nome.trim(),
    versao: rascunho.value.versao.trim(),
    release: rascunho.value.release.trim(),
    semana: Number(rascunho.value.semana),
    ano: Number(rascunho.value.ano),
    mes: rascunho.value.mes,
    dataInicio: rascunho.value.dataInicio,
    dataFinaliza: rascunho.value.dataFinaliza,
    dataPublicacao: rascunho.value.dataPublicacao,
    status: rascunho.value.status,
    descricao: rascunho.value.descricao.trim(),
    destaqueSemana: rascunho.value.destaqueSemana
  }

  salvando.value = true
  try {
    if (props.modo === 'editar' && props.release) {
      await atualizar(props.release.id, dados)
      toast.success('Release Week', 'Release Week atualizada com sucesso.')
    } else {
      await adicionar(dados)
      toast.success('Release Week', 'Release Week incluída com sucesso.')
    }
    emit('update:modelValue', false)
  } catch (erro) {
    const e = erro as {
      statusCode?: number
      statusMessage?: string
      data?: { statusMessage?: string; erros?: Partial<Record<CampoReleaseWeek, string>> }
    }
    const mensagem =
      e.data?.statusMessage ?? e.statusMessage ?? 'Não foi possível salvar a Release Week.'
    if (e.statusCode === 400 && e.data?.erros) {
      erros.value = { ...erros.value, ...e.data.erros }
      const ordem: CampoReleaseWeek[] = [
        'nome',
        'semana',
        'ano',
        'mes',
        'dataInicio',
        'dataFinaliza',
        'dataPublicacao'
      ]
      const primeiro = ordem.find((campo) => erros.value[campo])
      if (primeiro) focarCampo(primeiro)
    } else {
      toast.danger('Release Week', mensagem)
    }
  } finally {
    salvando.value = false
  }
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: edição copia o registro; criação/clonagem usa os padrões + prefill.
watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) return
    erros.value = {}
    if (props.modo === 'editar' && props.release) {
      const r = props.release
      rascunho.value = {
        codigo: r.codigo,
        nome: r.nome,
        versao: r.versao,
        release: r.release,
        semana: String(r.semana),
        ano: String(r.ano),
        mes: r.mes,
        dataInicio: r.dataInicio,
        dataFinaliza: r.dataFinaliza,
        dataPublicacao: r.dataPublicacao,
        status: r.status,
        descricao: r.descricao,
        destaqueSemana: r.destaqueSemana,
        criadoEm: r.criadoEm,
        atualizadoEm: r.atualizadoEm
      }
    } else {
      rascunho.value = rascunhoVazio(props.prefill)
    }
  },
  { immediate: true }
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="titulo"
    subtitle="Cabeçalho da semana de entrega"
    :icon="Rocket"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]">
      <UiModalSection title="Dados da Semana" :icon="Rocket" class="[&>div.grid]:gap-y-[11px]">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <div class="flex flex-col gap-[11px] sm:col-span-6 sm:flex-row sm:gap-4">
            <div v-if="modo === 'editar'" class="sm:w-[calc(12ch+32px)] sm:shrink-0">
              <UiInput label="Código" :model-value="rascunho.codigo" disabled mono />
            </div>
            <UiInput
              v-model="rascunho.nome"
              data-campo="nome"
              class="flex-1"
              label="Nome"
              placeholder="Ex.: Release Week 43 — Outubro"
              :error="erros.nome"
            />
          </div>

          <UiInput
            v-model="rascunho.versao"
            class="sm:col-span-3"
            label="Versão"
            placeholder="Ex.: 26.10c"
          />
          <UiInput
            v-model="rascunho.release"
            class="sm:col-span-3"
            label="Release"
            placeholder="Ex.: 26.10c10.12a"
          />

          <UiInput
            :model-value="rascunho.semana"
            data-campo="semana"
            class="sm:col-span-2"
            type="number"
            label="Semana"
            placeholder="1 a 52"
            :error="erros.semana"
            @update:model-value="definirSemana"
          />
          <UiInput
            v-model="rascunho.ano"
            data-campo="ano"
            class="sm:col-span-2"
            type="number"
            label="Ano"
            placeholder="2026"
            :error="erros.ano"
          />
          <div data-campo="mes" class="sm:col-span-2">
            <UiSelect
              :model-value="rascunho.mes"
              :options="opcoesMes"
              label="Mês"
              placeholder="Selecione o mês"
              :error="erros.mes"
              @update:model-value="rascunho.mes = String($event)"
            />
          </div>

          <div data-campo="dataInicio" class="sm:col-span-2">
            <UiDatePicker
              :model-value="paraData(rascunho.dataInicio)"
              label="Data de início"
              :error="erros.dataInicio"
              @update:model-value="definirData('dataInicio', $event)"
            />
          </div>
          <div data-campo="dataFinaliza" class="sm:col-span-2">
            <UiDatePicker
              :model-value="paraData(rascunho.dataFinaliza)"
              label="Data de finalização"
              :error="erros.dataFinaliza"
              @update:model-value="definirData('dataFinaliza', $event)"
            />
          </div>
          <div data-campo="dataPublicacao" class="sm:col-span-2">
            <UiDatePicker
              :model-value="paraData(rascunho.dataPublicacao)"
              label="Data de publicação"
              :error="erros.dataPublicacao"
              @update:model-value="definirData('dataPublicacao', $event)"
            />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Conteúdo e Status" :icon="FileText">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <div class="sm:col-span-6">
            <UiTextarea
              v-model="rascunho.descricao"
              label="Descrição"
              placeholder="Texto descritivo consolidado das novidades"
              :rows="3"
            />
          </div>
          <UiSegmented
            :model-value="rascunho.status"
            class="sm:col-span-4"
            label="Status"
            :options="statusOpcoes"
            @update:model-value="rascunho.status = $event as StatusRelease"
          />
          <div class="flex items-center sm:col-span-2">
            <UiSwitch v-model="rascunho.destaqueSemana" label="Destaque da semana" />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection
        v-if="modo === 'editar'"
        title="Informações de Cadastro"
        :icon="Clock"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-3">
          <UiInput label="Criado em" :model-value="formatarDataHora(rascunho.criadoEm)" disabled />
          <UiInput
            label="Atualizado em"
            :model-value="formatarDataHora(rascunho.atualizadoEm)"
            disabled
          />
          <UiInput
            label="Data de publicação"
            :model-value="formatarData(rascunho.dataPublicacao)"
            disabled
            mono
          />
        </div>
        <p class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
          O período é exibido na listagem como dd/mm/aaaa.
        </p>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" :disabled="salvando" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>
</template>
