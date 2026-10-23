<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { BookOpen, FileText, Clock, Star } from '@lucide/vue'
import type { SegmentedOption } from '../ui/Segmented.vue'
import { useToast } from '../../composables/useToast'
import { usePermissions } from '../../composables/usePermissions'
import {
  MESES,
  formatarData,
  validarManual,
  useManuaisModelo,
  type CampoManual,
  type ManuaisModelo,
  type StatusManual
} from './useManuaisModelo'

interface PrefillClone {
  titulo: string
  descricao: string
  destaqueMes: boolean
  destaqueSemana: boolean
}

interface Props {
  modelValue: boolean
  modo: 'novo' | 'editar'
  manual?: ManuaisModelo | null
  prefill?: PrefillClone | null
}

const props = withDefaults(defineProps<Props>(), {
  manual: null,
  prefill: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { can } = usePermissions()
const { manuais, adicionar, atualizar } = useManuaisModelo()

interface Rascunho {
  codigo: string
  titulo: string
  descricao: string
  mes: string
  ano: string
  status: StatusManual
  destaqueMes: boolean
  destaqueSemana: boolean
  dataPublicacao: string
  criadoEm: string
  atualizadoEm: string
}

const rascunhoVazio = (prefill?: PrefillClone | null): Rascunho => ({
  codigo: '',
  titulo: prefill?.titulo ?? '',
  descricao: prefill?.descricao ?? '',
  // Novo abre no mês atual; a clonagem deixa mês e ano em branco (identidade).
  mes: prefill ? '' : (MESES[new Date().getMonth()] ?? ''),
  ano: prefill ? '' : String(new Date().getFullYear()),
  status: 'Rascunho',
  destaqueMes: prefill?.destaqueMes ?? false,
  destaqueSemana: prefill?.destaqueSemana ?? false,
  dataPublicacao: '',
  criadoEm: '',
  atualizadoEm: ''
})

const rascunho = ref<Rascunho>(rascunhoVazio())
const erros = ref<Partial<Record<CampoManual, string>>>({})
const salvando = ref(false)

const titulo = computed(() => {
  if (props.modo === 'editar') return 'Editar Manual'
  if (props.prefill) return 'Clonar Manual'
  return 'Novo Manual'
})

const opcoesMes = MESES.map((mes) => ({ value: mes, label: mes }))
const statusOpcoes = computed<SegmentedOption[]>(() => {
  const opcoes: SegmentedOption[] = [
    { value: 'Rascunho', label: 'Rascunho', tone: 'slate' },
    { value: 'Em Revisão', label: 'Em Revisão', tone: 'indigo' },
    { value: 'Alterações Solicitadas', label: 'Alterações', tone: 'rose' },
    { value: 'Aprovado', label: 'Aprovado', tone: 'emerald' }
  ]
  // Publicar é uma ação própria: sem a permissão, a opção só aparece para
  // exibir o status atual de um registro já publicado (somente leitura).
  if (can('manuais', 'publicar') || rascunho.value.status === 'Publicado') {
    opcoes.push({ value: 'Publicado', label: 'Publicado', tone: 'navy' })
  }
  return opcoes
})

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
  const resultado = validarManual(rascunho.value, manuais.value, props.manual?.id)
  erros.value = resultado.erros
  if (resultado.primeiroErro) {
    focarCampo(resultado.primeiroErro)
    return false
  }
  return true
}

const salvar = async () => {
  if (!validar()) return
  salvando.value = true
  try {
    const dados = {
      titulo: rascunho.value.titulo.trim(),
      descricao: rascunho.value.descricao.trim(),
      mes: rascunho.value.mes,
      ano: Number(rascunho.value.ano),
      status: rascunho.value.status,
      destaqueMes: rascunho.value.destaqueMes,
      destaqueSemana: rascunho.value.destaqueSemana
    }
    if (props.modo === 'editar' && props.manual) {
      await atualizar(props.manual.id, dados)
      toast.success('Manuais Mensais', 'Manual atualizado com sucesso.')
    } else {
      await adicionar(dados)
      toast.success('Manuais Mensais', 'Manual incluído com sucesso.')
    }
    emit('update:modelValue', false)
  } catch (erro) {
    const e = erro as {
      statusCode?: number
      statusMessage?: string
      data?: {
        statusMessage?: string
        erros?: Partial<Record<CampoManual, string>>
      }
    }
    const mensagem =
      e.data?.statusMessage ?? e.statusMessage ?? 'Não foi possível salvar o manual.'
    if ((e.statusCode === 400 || e.statusCode === 409) && e.data?.erros) {
      erros.value = { ...erros.value, ...e.data.erros }
      const ordem: CampoManual[] = ['titulo', 'mes', 'ano']
      const primeiro = ordem.find((campo) => erros.value[campo])
      if (primeiro) focarCampo(primeiro)
    } else {
      toast.danger('Manuais Mensais', mensagem)
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
    if (props.modo === 'editar' && props.manual) {
      const m = props.manual
      rascunho.value = {
        codigo: m.codigo,
        titulo: m.titulo,
        descricao: m.descricao,
        mes: m.mes,
        ano: String(m.ano),
        status: m.status,
        destaqueMes: m.destaqueMes,
        destaqueSemana: m.destaqueSemana,
        dataPublicacao: m.dataPublicacao,
        criadoEm: m.criadoEm,
        atualizadoEm: m.atualizadoEm
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
    subtitle="Catálogo mensal de manuais e procedimentos técnicos"
    :icon="BookOpen"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]">
      <UiModalSection title="Dados do Catálogo" :icon="BookOpen" class="[&>div.grid]:gap-y-[11px]">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <div class="flex flex-col gap-[11px] sm:col-span-6 sm:flex-row sm:gap-4">
            <div v-if="modo === 'editar'" class="sm:w-[calc(13ch+32px)] sm:shrink-0">
              <UiInput label="Código" :model-value="rascunho.codigo" disabled mono />
            </div>
            <UiInput
              v-model="rascunho.titulo"
              data-campo="titulo"
              class="flex-1"
              label="Título"
              placeholder="Ex.: Manual de Integrações — Outubro"
              :error="erros.titulo"
            />
          </div>

          <div data-campo="mes" class="sm:col-span-4">
            <UiSelect
              :model-value="rascunho.mes"
              :options="opcoesMes"
              label="Mês"
              placeholder="Selecione o mês"
              :error="erros.mes"
              @update:model-value="rascunho.mes = String($event)"
            />
          </div>
          <UiInput
            v-model="rascunho.ano"
            data-campo="ano"
            class="sm:col-span-2"
            type="number"
            label="Ano"
            placeholder="2026"
            :error="erros.ano"
          />

          <div class="sm:col-span-6">
            <UiTextarea
              v-model="rascunho.descricao"
              label="Descrição"
              placeholder="Visão geral e escopo dos manuais publicados no mês"
              :rows="3"
            />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection title="Conteúdo e Status" :icon="FileText">
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <UiSegmented
            :model-value="rascunho.status"
            class="sm:col-span-4"
            label="Status"
            :options="statusOpcoes"
            @update:model-value="rascunho.status = $event as StatusManual"
          />
          <div class="flex flex-col justify-center gap-2 sm:col-span-2">
            <UiSwitch v-model="rascunho.destaqueMes" label="Destaque do mês" />
            <UiSwitch v-model="rascunho.destaqueSemana" label="Destaque da semana" />
          </div>
        </div>
      </UiModalSection>

      <UiModalSection v-if="modo === 'editar'" title="Informações de Cadastro" :icon="Clock">
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
          <Star class="h-3.5 w-3.5" aria-hidden="true" />
          Destaques e datas são exibidos na listagem como indicadores e dd/mm/aaaa.
        </p>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" :disabled="salvando" @click="salvar">
        Salvar
      </UiButton>
    </template>
  </UiModal>
</template>
