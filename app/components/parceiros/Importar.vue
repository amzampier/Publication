<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Import, AlertTriangle, BetweenHorizontalEnd, LoaderCircle } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import { lerPlanilhaParceiros, type LinhaImportacao, type SituacaoImportacao } from './lerPlanilhaParceiros'
import {
  VARIANTE_POR_SITUACAO,
  importarParceiros,
  useParceirosModelo,
  type SituacaoParceiro
} from './useParceirosModelo'
import { useToast } from '../../composables/useToast'

// Modal de importação de parceiros — aberto pelo botão de importação da toolbar
// da grade (spec parceiros: upload do modelo docs/modelos, pré-visualização com
// Resultado, seleção das linhas prontas; o COMMIT vai à API — parse local +
// revalidação server-side + gravação em transação com códigos sequenciais).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { toast } = useToast()
const { parceiros, carregarParceiros } = useParceirosModelo()

type LinhaSel = LinhaImportacao & { selecionada: boolean }

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
    const existentes = parceiros.value.map((p) => p.razao_social)
    const resultado = await lerPlanilhaParceiros(arquivos[0]!, existentes)
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

const contar = (s: SituacaoImportacao) => linhas.value.filter((l) => l.situacaoImportacao === s).length

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

const importar = async () => {
  const registros = selecionadas.value.map((l) => ({
    razao_social: l.razao_social,
    nome_fantasia: l.nome_fantasia,
    cidade: l.cidade,
    estado: l.estado,
    regiao: l.regiao,
    situacao: l.situacao
  }))
  if (!registros.length || processando.value || importando.value) return
  importando.value = true
  erro.value = null
  try {
    const { importados } = await importarParceiros(registros)
    await carregarParceiros(true)
    toast.success(
      'Parceiros',
      `${importados} parceiro${importados === 1 ? '' : 's'} importado${importados === 1 ? '' : 's'} com sucesso.`
    )
    emit('update:modelValue', false)
  } catch (erroApi) {
    const e = erroApi as {
      statusMessage?: string
      data?: { statusMessage?: string; motivos?: string[]; conflitos?: string[] }
    }
    const conflitos = e?.data?.conflitos ?? []
    if (conflitos.length) {
      const mapa = new Set(conflitos.map((c) => c.trim().toLowerCase()))
      for (const l of linhas.value) {
        if (mapa.has(l.razao_social.toLowerCase())) {
          l.situacaoImportacao = 'ja-cadastrado'
          l.selecionada = false
          l.motivo = ''
        }
      }
      const restamSelecionadas = linhas.value.some((l) => l.selecionada)
      erro.value = restamSelecionadas
        ? null
        : e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
    } else {
      const motivos = e?.data?.motivos
      const mensagem = e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
      erro.value = motivos?.length ? [mensagem, ...motivos].join(' ') : mensagem
    }
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
  { id: 'razao_social', header: 'Razão Social', accessorKey: 'razao_social', minWidth: 200 },
  { id: 'nome_fantasia', header: 'Nome Fantasia', accessorKey: 'nome_fantasia', minWidth: 160 },
  { id: 'localizacao', header: 'Localização', accessorKey: 'localizacao', minWidth: 150 },
  { id: 'regiao', header: 'Região', accessorKey: 'regiao', minWidth: 120 },
  { id: 'situacao', header: 'Situação', accessorKey: 'situacao', minWidth: 100 },
  { id: 'resultado', header: 'Resultado', accessorKey: 'situacaoImportacao', minWidth: 165 }
]

// Linha de localização combinada (cidade - UF) para exibição/ordenação.
const dadosTabela = computed(() =>
  linhas.value.map((l) => ({
    ...l,
    localizacao: [l.cidade, l.estado].filter(Boolean).join(' - ') || '—'
  }))
)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Importar Parceiros"
    subtitle="Planilha modelo (.xlsx)"
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
            :key="r.razao_social"
            class="flex items-center justify-between gap-3 text-xs"
          >
            <span class="min-w-0">
              <span class="font-medium text-slate-800">{{ r.razao_social }}</span>
              <span class="text-slate-500"> — {{ r.estado || 'sem UF' }}</span>
            </span>
            <LoaderCircle
              class="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
              aria-hidden="true"
            />
          </li>
        </ul>
        <p class="text-[11px] text-slate-500">
          Os registros são gravados em lote; nenhum é marcado como concluído até a confirmação do servidor.
        </p>
      </UiModalSection>

      <UiModalSection
        v-if="linhas.length && !importando"
        title="Pré-visualização da importação"
        :icon="BetweenHorizontalEnd"
      >
        <UiDataTable
          title="Linhas do arquivo"
          subtitle="Marque as linhas prontas para importar"
          :data="dadosTabela"
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
              :aria-label="`Selecionar ${row.razao_social}`"
              :model-value="row.selecionada"
              :disabled="row.situacaoImportacao !== 'pronto'"
              @update:model-value="definirSelecao(row, Boolean($event))"
            />
          </template>

          <template #cell(situacao)="{ value }">
            <UiBadge :variant="VARIANTE_POR_SITUACAO[value as SituacaoParceiro]" size="sm">
              {{ value }}
            </UiBadge>
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
            @click="importar"
          >
            Importar ({{ selecionadas.length }})
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
