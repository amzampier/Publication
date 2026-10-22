<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle, Import, LoaderCircle } from '@lucide/vue'
import type { ColumnDef } from '../../utils/dataGrid'
import { useToast } from '../../composables/useToast'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'
import { formatarData, type LinhaImportacaoChamada } from './validadores'
import {
  lerPlanilhaLancarChamadas,
  type LinhaImportacaoChamadaPreview,
  type SituacaoImportacaoChamada
} from './lerPlanilhaLancarChamadas'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { toast } = useToast()
const { chamadas, catalogo, importar } = useLancarChamadasModelo()

const linhas = ref<LinhaImportacaoChamadaPreview[]>([])
const erro = ref<string | null>(null)
const processando = ref(false)
const importando = ref(false)

watch(
  () => props.modelValue,
  (aberto) => {
    if (!aberto) return
    linhas.value = []
    erro.value = null
    processando.value = false
    importando.value = false
  }
)

const aoSelecionar = async (arquivos: File[] | null) => {
  linhas.value = []
  erro.value = null
  if (!arquivos?.length) return
  processando.value = true
  try {
    const resultado = await lerPlanilhaLancarChamadas(
      arquivos[0]!,
      chamadas.value.map((chamada) => chamada.chamada),
      catalogo.value
    )
    if (resultado.erro) {
      erro.value = resultado.erro
      return
    }
    linhas.value = resultado.linhas
  } catch {
    erro.value = 'Não foi possível validar a planilha. Tente novamente.'
  } finally {
    processando.value = false
  }
}

const contar = (situacao: SituacaoImportacaoChamada) =>
  linhas.value.filter((linha) => linha.situacaoImportacao === situacao).length

const prontas = computed(() => contar('pronto'))
const jaCadastradas = computed(() => contar('ja-cadastrado'))
const repetidas = computed(() => contar('repetido'))
const invalidas = computed(() => contar('invalido'))
const bloqueada = computed(() => jaCadastradas.value + repetidas.value + invalidas.value > 0)

const paraImportacao = (linha: LinhaImportacaoChamadaPreview): LinhaImportacaoChamada => ({
  chamada: linha.chamada,
  titulo: linha.titulo,
  dataLancamento: linha.dataLancamento,
  dataLiberacao: linha.dataLiberacao,
  releaseCodigo: linha.releaseCodigo,
  projetoCodigo: linha.projetoCodigo,
  manualCodigo: linha.manualCodigo,
  softwareCodigos: linha.softwareCodigos,
  parceiroCodigo: linha.parceiroCodigo,
  modulo: linha.modulo,
  menuFuncionalidade: linha.menuFuncionalidade,
  tipo: linha.tipo,
  impacto: linha.impacto,
  descricaoCompleta: linha.descricaoCompleta,
  manualTitulo: linha.manualTitulo,
  linkManual: linha.linkManual,
  linkVideo: linha.linkVideo,
  tags: linha.tags
})

const executarImportacao = async () => {
  if (!prontas.value || bloqueada.value || processando.value || importando.value) return
  const dados = linhas.value
    .filter((linha) => linha.situacaoImportacao === 'pronto')
    .map(paraImportacao)
  importando.value = true
  erro.value = null
  try {
    const resultado = await importar(dados)
    toast.success('Lançar as Chamadas', `${resultado.importados} chamada(s) importada(s) com sucesso.`)
    emit('update:modelValue', false)
  } catch (erroApi) {
    const e = erroApi as {
      statusMessage?: string
      data?: { statusMessage?: string; motivos?: string[]; conflitos?: string[] }
    }
    const mensagem = e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
    const detalhes = [...(e?.data?.motivos ?? []), ...(e?.data?.conflitos ?? [])]
    erro.value = detalhes.length ? [mensagem, ...detalhes].join(' ') : mensagem
  } finally {
    importando.value = false
  }
}

const fechar = () => emit('update:modelValue', false)

const VARIANTE_RESULTADO: Record<SituacaoImportacaoChamada, 'done' | 'pending' | 'neutral' | 'blocked'> = {
  pronto: 'done',
  'ja-cadastrado': 'pending',
  repetido: 'neutral',
  invalido: 'blocked'
}

const ROTULO_RESULTADO: Record<SituacaoImportacaoChamada, string> = {
  pronto: 'Pronto para importar',
  'ja-cadastrado': 'Já cadastrado',
  repetido: 'Repetido no arquivo',
  invalido: 'Linha inválida'
}

const colunas: ColumnDef[] = [
  { id: 'linha', header: 'Linha', accessorKey: 'linha', width: 70, align: 'center' },
  { id: 'chamada', header: 'Chamada', accessorKey: 'chamada', minWidth: 130 },
  { id: 'titulo', header: 'Título', accessorKey: 'titulo', minWidth: 240 },
  {
    id: 'dataLancamento',
    header: 'Lançamento',
    accessorKey: 'dataLancamento',
    minWidth: 110,
    format: (valor) => formatarData(String(valor ?? ''))
  },
  { id: 'releaseCodigo', header: 'Release', accessorKey: 'releaseCodigo', minWidth: 120 },
  {
    id: 'softwareCodigos',
    header: 'Softwares',
    accessorKey: 'softwareCodigos',
    minWidth: 140,
    format: (val: string[]) => (Array.isArray(val) ? val.join('; ') : String(val ?? ''))
  },
  { id: 'parceiroCodigo', header: 'Parceiro', accessorKey: 'parceiroCodigo', minWidth: 110 },
  { id: 'resultado', header: 'Resultado', accessorKey: 'situacaoImportacao', minWidth: 165 },
  { id: 'motivo', header: 'Motivo', accessorKey: 'motivo', minWidth: 220 }
]
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Importar Chamadas"
    subtitle="Planilha modelo (.xlsx) — importação em lote"
    :icon="Import"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Planilha modelo" :icon="Import">
        <UiUploadFiles
          lista-separada
          rotulo="Arraste o arquivo aqui ou clique para selecionar"
          dica="Formatos aceitos: .xlsx"
          rotulo-lista="Arquivo selecionado"
          aceitar=".xlsx"
          :multiple="false"
          :mostrar-camera="false"
          @change="aoSelecionar"
        />
        <p v-if="processando" class="text-xs italic text-slate-500">Lendo planilha.</p>
        <div
          v-if="erro"
          role="alert"
          class="flex items-start gap-2 rounded-lg border border-rose-700 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700"
        >
          <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
          <span>{{ erro }}</span>
        </div>
      </UiModalSection>

      <UiModalSection
        v-if="importando"
        title="Importando chamadas"
        :icon="LoaderCircle"
      >
        <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
          <LoaderCircle
            class="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
            aria-hidden="true"
          />
          Gravando {{ prontas }} chamada(s) em uma única transação.
        </div>
      </UiModalSection>

      <UiModalSection
        v-if="linhas.length && !processando"
        title="Pré-visualização da importação"
        :icon="Import"
      >
        <div class="flex flex-wrap gap-2 text-xs">
          <UiBadge variant="done" size="sm" :show-icon="false">{{ prontas }} pronta(s)</UiBadge>
          <UiBadge variant="pending" size="sm" :show-icon="false">{{ jaCadastradas }} já cadastrada(s)</UiBadge>
          <UiBadge variant="neutral" size="sm" :show-icon="false">{{ repetidas }} repetida(s)</UiBadge>
          <UiBadge variant="blocked" size="sm" :show-icon="false">{{ invalidas }} inválida(s)</UiBadge>
        </div>

        <UiDataTable
          title="Linhas do arquivo"
          subtitle="Todas as linhas precisam estar prontas para a importação ser gravada"
          :data="linhas"
          :columns="colunas"
          :default-page-size="10"
          show-header-top
        >
          <template #cell(resultado)="{ value }">
            <UiBadge
              :variant="VARIANTE_RESULTADO[value as SituacaoImportacaoChamada]"
              size="sm"
              :show-icon="false"
            >
              {{ ROTULO_RESULTADO[value as SituacaoImportacaoChamada] }}
            </UiBadge>
          </template>
        </UiDataTable>

        <p v-if="bloqueada" class="text-xs font-medium text-rose-700">
          Corrija ou remova as linhas inválidas, repetidas e já cadastradas para liberar a importação.
        </p>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" :disabled="importando" @click="fechar">Cancelar</UiButton>
      <UiButton
        variant="primary"
        :loading="importando"
        :disabled="prontas === 0 || bloqueada || processando"
        @click="executarImportacao"
      >
        <template #leftIcon><Import class="h-4 w-4" /></template>
        Importar {{ prontas || '' }}
      </UiButton>
    </template>
  </UiModal>
</template>
