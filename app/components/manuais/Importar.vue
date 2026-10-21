<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Import, AlertTriangle, BetweenHorizontalEnd, LoaderCircle } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import {
  lerPlanilhaManuais,
  type LinhaImportacaoManual,
  type SituacaoImportacao
} from './lerPlanilhaManuais'
import { formatarData, useManuaisModelo } from './useManuaisModelo'
import { useToast } from '../../composables/useToast'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { toast } = useToast()
const { manuais, importar } = useManuaisModelo()

type LinhaSel = LinhaImportacaoManual & { selecionada: boolean }

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
    const existentes = manuais.value.map((manual) => `${manual.ano}-${manual.mesNumero}`)
    const resultado = await lerPlanilhaManuais(arquivos[0]!, existentes)
    if (resultado.erro) {
      erro.value = resultado.erro
      return
    }
    linhas.value = resultado.linhas.map((l) => ({
      ...l,
      selecionada: l.situacaoImportacao === 'pronto'
    }))
  } catch {
    erro.value = 'Não foi possível validar a planilha. Tente novamente.'
  } finally {
    processando.value = false
  }
}

const contar = (s: SituacaoImportacao) =>
  linhas.value.filter((l) => l.situacaoImportacao === s).length

const prontas = computed(() => contar('pronto'))
const selecionadas = computed(() => linhas.value.filter((l) => l.selecionada))

const todosProntos = computed(
  () =>
    prontas.value > 0 &&
    linhas.value.filter((l) => l.situacaoImportacao === 'pronto').every((l) => l.selecionada)
)
const algunsProntos = computed(() => selecionadas.value.length > 0 && !todosProntos.value)

const definirSelecao = (linha: LinhaSel, marcada: boolean) => {
  linha.selecionada = marcada
}

const alternarTodos = (marcado: boolean) => {
  for (const l of linhas.value) if (l.situacaoImportacao === 'pronto') l.selecionada = marcado
}

const executarImportacao = async () => {
  const registros = selecionadas.value.map((l) => ({
    titulo: l.titulo,
    descricao: l.descricao,
    mes: l.mes,
    ano: Number(l.ano),
    status: l.status || 'Rascunho',
    dataCriacao: l.dataCriacao,
    dataPublicacao: l.dataPublicacao,
    destaqueMes: l.destaqueMes === 'Sim',
    destaqueSemana: l.destaqueSemana === 'Sim'
  }))
  if (!registros.length || processando.value || importando.value) return
  importando.value = true
  erro.value = null
  try {
    const resultado = await importar(registros)
    toast.success(
      'Manuais Mensais',
      `${resultado.importados} manual(is) importado(s) com sucesso.`
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
  {
    id: 'mesAno',
    header: 'Mês/Ano',
    accessorKey: 'mes',
    minWidth: 120,
    format: (_v, row) => `${row.mes} / ${row.ano}`
  },
  { id: 'titulo', header: 'Título', accessorKey: 'titulo', minWidth: 240 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 130 },
  {
    id: 'dataPublicacao',
    header: 'Publicação',
    accessorKey: 'dataPublicacao',
    minWidth: 110,
    format: (v) => formatarData(String(v ?? ''))
  },
  {
    id: 'destaques',
    header: 'Destaques',
    accessorKey: 'destaqueMes',
    minWidth: 140,
    format: (_v, row) => {
      const itens: string[] = []
      if (row.destaqueMes === 'Sim') itens.push('Mês')
      if (row.destaqueSemana === 'Sim') itens.push('Semana')
      return itens.join(' · ') || '—'
    }
  },
  { id: 'resultado', header: 'Resultado', accessorKey: 'situacaoImportacao', minWidth: 165 }
]
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Importar Manuais Mensais"
    subtitle="Planilha modelo (.xlsx) — importação histórica"
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
          <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
          <span>{{ erro }}</span>
        </div>
      </UiModalSection>

      <UiModalSection
        v-if="importando && selecionadas.length"
        title="Importando registros"
        :icon="BetweenHorizontalEnd"
      >
        <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
          <LoaderCircle
            class="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
            aria-hidden="true"
          />
          Importando {{ selecionadas.length }} registro(s)…
        </div>
        <ul
          class="max-h-[240px] grid gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <li
            v-for="r in selecionadas"
            :key="`${r.ano}-${r.mes}`"
            class="flex items-center justify-between gap-3 text-xs"
          >
            <span class="min-w-0">
              <span class="font-medium text-slate-800">{{ r.titulo }}</span>
              <span class="text-slate-500"> — {{ r.mes }} / {{ r.ano }}</span>
            </span>
            <LoaderCircle
              class="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
              aria-hidden="true"
            />
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
              :aria-label="`Selecionar ${row.titulo}`"
              :model-value="row.selecionada"
              :disabled="row.situacaoImportacao !== 'pronto'"
              @update:model-value="definirSelecao(row, Boolean($event))"
            />
          </template>

          <template #cell(resultado)="{ row }">
            <div class="flex flex-col items-start gap-0.5">
              <UiBadge :variant="VARIANTE_RESULTADO[row.situacaoImportacao as SituacaoImportacao]" size="sm">
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
