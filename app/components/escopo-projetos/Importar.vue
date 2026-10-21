<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Import, AlertTriangle, BetweenHorizontalEnd, LoaderCircle } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import {
  lerPlanilhaEscopoProjetos,
  type LinhaImportacaoEscopo,
  type SituacaoImportacao
} from './lerPlanilhaEscopoProjetos'
import { chaveAnoVersao, formatarData, useEscopoProjetosModelo } from './useEscopoProjetosModelo'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { toast } = useToast()
const { escopos, importar } = useEscopoProjetosModelo()

type LinhaSel = LinhaImportacaoEscopo & { selecionada: boolean }

const linhas = ref<LinhaSel[]>([])
const erro = ref<string | null>(null)
const processando = ref(false)
const importando = ref(false)

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      linhas.value = []
      erro.value = null
      processando.value = false
      importando.value = false
    }
  }
)

const aoSelecionar = async (arquivos: File[] | null) => {
  linhas.value = []
  erro.value = null
  if (!arquivos?.length) return
  processando.value = true
  try {
    const existentes = escopos.value.map((escopo) =>
      chaveAnoVersao(escopo.ano, escopo.versao)
    )
    const resultado = await lerPlanilhaEscopoProjetos(arquivos[0]!, existentes)
    if (resultado.erro) {
      erro.value = resultado.erro
      return
    }
    linhas.value = resultado.linhas.map((linha) => ({
      ...linha,
      selecionada: linha.situacaoImportacao === 'pronto'
    }))
  } catch {
    erro.value = 'Não foi possível validar a planilha. Tente novamente.'
  } finally {
    processando.value = false
  }
}

const contar = (situacao: SituacaoImportacao) =>
  linhas.value.filter((linha) => linha.situacaoImportacao === situacao).length

const prontas = computed(() => contar('pronto'))
const selecionadas = computed(() => linhas.value.filter((linha) => linha.selecionada))

const todosProntos = computed(
  () =>
    prontas.value > 0 &&
    linhas.value
      .filter((linha) => linha.situacaoImportacao === 'pronto')
      .every((linha) => linha.selecionada)
)
const algunsProntos = computed(() => selecionadas.value.length > 0 && !todosProntos.value)

const definirSelecao = (linha: LinhaSel, marcada: boolean) => {
  linha.selecionada = marcada
}

const alternarTodos = (marcado: boolean) => {
  for (const linha of linhas.value) {
    if (linha.situacaoImportacao === 'pronto') linha.selecionada = marcado
  }
}

const executarImportacao = async () => {
  const registros = selecionadas.value.map((linha) => ({
    nome: linha.nome,
    versao: linha.versao,
    ano: Number(linha.ano),
    dataInicio: linha.dataInicio,
    dataFinal: linha.dataFinal,
    dataPrevisao: linha.dataPrevisao,
    dataPublicacao: linha.dataPublicacao,
    status: linha.status,
    descricaoGeral: linha.descricaoGeral
  }))
  if (!registros.length || processando.value || importando.value) return
  importando.value = true
  erro.value = null
  try {
    const resultado = await importar(registros)
    toast.success(
      'Escopo de Projetos',
      `${resultado.importados} escopo(s) importado(s) com sucesso.`
    )
    emit('update:modelValue', false)
  } catch (erroApi) {
    const e = erroApi as {
      statusMessage?: string
      data?: { statusMessage?: string; motivos?: string[]; conflitos?: string[] }
    }
    const mensagem = e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
    const motivos = e?.data?.motivos
    erro.value = motivos?.length ? [mensagem, ...motivos].join(' ') : mensagem
  } finally {
    importando.value = false
  }
}

const fechar = () => emit('update:modelValue', false)

const VARIANTE_RESULTADO: Record<SituacaoImportacao, 'done' | 'pending' | 'neutral' | 'blocked'> = {
  pronto: 'done',
  'ja-cadastrado': 'pending',
  repetido: 'neutral',
  invalido: 'blocked'
}

const ROTULO_RESULTADO: Record<SituacaoImportacao, string> = {
  pronto: 'Pronto para importar',
  'ja-cadastrado': 'Já cadastrado',
  repetido: 'Repetido no arquivo',
  invalido: 'Linha inválida'
}

const colunas: ColumnDef[] = [
  { id: 'selecao', header: '', accessorKey: 'situacaoImportacao', width: 34, align: 'center' },
  { id: 'nome', header: 'Nome', accessorKey: 'nome', minWidth: 240 },
  {
    id: 'versaoAno',
    header: 'Versão / Ano',
    accessorKey: 'versao',
    minWidth: 130,
    format: (_valor, linha) => `${linha.versao} / ${linha.ano}`
  },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 130 },
  {
    id: 'dataPublicacao',
    header: 'Publicação',
    accessorKey: 'dataPublicacao',
    minWidth: 110,
    format: (valor) => formatarData(String(valor ?? ''))
  },
  {
    id: 'resultado',
    header: 'Resultado',
    accessorKey: 'situacaoImportacao',
    minWidth: 165
  }
]
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Importar Escopos"
    subtitle="Planilha modelo (.xlsx) — importação de escopos"
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
        <p v-if="processando" class="text-xs italic text-slate-500">Lendo planilha…</p>
        <div
          v-if="erro"
          role="alert"
          class="flex items-start gap-2 rounded-lg border border-rose-700 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ erro }}</span>
        </div>
      </UiModalSection>

      <UiModalSection
        v-if="importando && selecionadas.length"
        title="Importando escopos"
        :icon="BetweenHorizontalEnd"
      >
        <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
          <LoaderCircle
            class="h-4 w-4 shrink-0 animate-spin text-brand-structure motion-reduce:animate-none"
            aria-hidden="true"
          />
          Importando {{ selecionadas.length }} escopo(s)…
        </div>
        <ul
          class="grid max-h-[240px] gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <li
            v-for="linha in selecionadas"
            :key="`${linha.ano}-${linha.versao}`"
            class="flex items-center justify-between gap-3 text-xs"
          >
            <span class="min-w-0">
              <span class="font-medium text-slate-800">{{ linha.nome }}</span>
              <span class="text-slate-500"> — {{ linha.versao }} / {{ linha.ano }}</span>
            </span>
          </li>
        </ul>
      </UiModalSection>

      <UiModalSection
        v-if="linhas.length && !importando"
        title="Pré-visualização da importação"
        :icon="BetweenHorizontalEnd"
      >
        <UiDataTable
          title="Linhas do arquivo"
          subtitle="Marque as linhas prontas para importar"
          :data="linhas"
          :columns="colunas"
          :default-page-size="10"
          show-header-top
        >
          <template #filtersLeft>
            <UiCheckbox
              size="sm"
              label="Selecionar todos os prontos"
              :model-value="todosProntos"
              :indeterminate="algunsProntos"
              :disabled="prontas === 0"
              @update:model-value="alternarTodos(Boolean($event))"
            />
          </template>

          <template #cell(selecao)="{ row }">
            <UiCheckbox
              size="sm"
              :aria-label="`Selecionar ${row.nome}`"
              :model-value="row.selecionada"
              :disabled="row.situacaoImportacao !== 'pronto'"
              @update:model-value="definirSelecao(row, Boolean($event))"
            />
          </template>

          <template #cell(resultado)="{ row }">
            <div class="flex flex-col items-start gap-0.5">
              <UiBadge
                :variant="VARIANTE_RESULTADO[row.situacaoImportacao as SituacaoImportacao]"
                size="sm"
              >
                {{ ROTULO_RESULTADO[row.situacaoImportacao as SituacaoImportacao] }}
              </UiBadge>
              <span v-if="row.motivo" class="text-[10px] font-medium text-rose-700">
                {{ row.motivo }}
              </span>
            </div>
          </template>
        </UiDataTable>
      </UiModalSection>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2.5">
        <span v-if="linhas.length" class="text-xs text-slate-500">
          {{ selecionadas.length }} de {{ linhas.length }} linha(s) selecionada(s)
        </span>
        <span v-else />
        <div class="flex items-center gap-2.5">
          <UiButton variant="outline" @click="fechar">Cancelar</UiButton>
          <UiButton
            variant="primary"
            :disabled="selecionadas.length === 0 || importando"
            :loading="importando"
            @click="executarImportacao"
          >
            Importar ({{ selecionadas.length }})
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
